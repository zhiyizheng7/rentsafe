#!/usr/bin/env python3
"""
F2 租金行情：把內政部實價登錄租賃資料（臺北市 a_lvr_land_c.xls）整理成 data/rent-benchmark.json。

執行：.venv/bin/python scripts/build_rent_benchmark.py
需要：pandas、xlrd（.venv/bin/pip install pandas xlrd）

輸出只含各「行政區 × 出租型態」的統計值，不含任何逐筆資料（地址、門牌、編號）。
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
import warnings
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

try:
    import pandas as pd
except ImportError:
    sys.exit("缺少 pandas，請執行：.venv/bin/pip install pandas xlrd")
try:
    import xlrd  # noqa: F401  pandas 讀 .xls 需要
except ImportError:
    sys.exit("缺少 xlrd，請執行：.venv/bin/pip install xlrd")

# pandas 新版提示 xlrd 引擎將淘汰；目前仍可用，先不顯示這則警告
warnings.filterwarnings("ignore", message=".*xlrd engine is deprecated.*")

ROOT = Path(__file__).resolve().parent.parent
RAW_GLOB = "data/raw/contract_*/a_lvr_land_c.xls"
OUT_PATH = ROOT / "data" / "rent-benchmark.json"
SHEET = "不動產租賃"

PING_PER_M2 = 3.3058  # 1 平方公尺單價 × 3.3058 = 每坪單價
MIN_SAMPLE = 10
IQR_K = 1.5
# 建物多樣性：棟數太少或最大一棟占比過高，中位數可能只反映少數房東的定價
MIN_BUILDINGS = 8
MAX_TOP_SHARE = 0.4
HIGHLIGHT_DISTRICT = "文山區"

TARGET_SUBJECT = "租賃房屋"
RESIDENTIAL_PREFIXES = ("公寓", "住宅大樓", "華廈", "透天厝", "套房")
# 分租：月租是單間租金，建物總面積可能是整層面積，每坪月租沒有意義
ROOM_SHARE_TYPES = {"分租套房", "分租雅房"}

REQUIRED_COLS = [
    "鄉鎮市區", "交易標的", "建物型態", "出租型態", "總額元", "單價元平方公尺",
    "建物總面積平方公尺", "租賃年月日", "編號", "有無管理員", "有無附傢俱",
    "土地位置建物門牌",
]

PERIOD_NOTE = "租賃訂約日期，內政部實價登錄公開資料，非即時"
METHOD_NOTE = (
    "篩選交易標的為租賃房屋、建物型態為公寓／住宅大樓／華廈／透天厝／套房；"
    "各行政區×出租型態以 IQR（1.5 倍）排除月租離群值後計算中位數與第 25、75 百分位；"
    f"樣本數少於 {MIN_SAMPLE} 標示樣本不足、不提供統計值；"
    "每坪月租 = 單價元平方公尺 × 3.3058；"
    "分租套房、分租雅房的月租為單間租金，但建物總面積可能為整層面積，故僅提供月租、不提供每坪月租；"
    f"以門牌（不含樓層與之幾）辨識建物，buildingCount 為不同建物棟數、topBuildingShare 為筆數最多一棟的占比，"
    f"棟數少於 {MIN_BUILDINGS} 或最大一棟占比超過 {MAX_TOP_SHARE:.0%} 標示 lowDiversity；"
    "lowDiversity 表示樣本集中於少數建物，僅供參考"
)


# ---------- 小工具 ----------

def log_step(label: str, before: int, after: int, reason: str) -> None:
    print(f"  {label:<14} 剩 {after:>5} 筆｜篩掉 {before - after:>4} 筆｜{reason}")


def print_counts(title: str, s: pd.Series) -> None:
    print(f"\n【{title}】所有值與筆數")
    vc = s.fillna("(空白)").value_counts()
    for k, v in vc.items():
        print(f"  {v:>5}  {k}")
    print(f"  {vc.sum():>5}  合計")


def roc_to_date(v: str | float | None) -> date | None:
    """民國 7 位數（1150811）→ 西元 date；6 位數（990811）也接受。"""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    if not re.fullmatch(r"\d{6,7}", s):
        return None
    y, m, d = int(s[:-4]) + 1911, int(s[-4:-2]), int(s[-2:])
    try:
        return date(y, m, d)
    except ValueError:
        return None


def disp_width(s: str) -> int:
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in s)


def pad(s: str, width: int, right: bool = False) -> str:
    gap = " " * max(0, width - disp_width(s))
    return gap + s if right else s + gap


_FLOOR_TAIL = re.compile(r"(地下.*|[\d一二三四五六七八九十百]+樓.*)$")


def building_key(addr: str | float | None) -> str:
    """門牌 → 建物鍵：全形轉半形，截到第一個「號」，去掉「之幾」；樓層與之幾一律不保留。
    只在記憶體中用於計算棟數，不得輸出。"""
    if addr is None or (isinstance(addr, float) and pd.isna(addr)):
        return ""
    s = unicodedata.normalize("NFKC", str(addr)).strip().replace(" ", "")
    i = s.find("號")
    if i >= 0:
        s = s[: i + 1]
        s = re.sub(r"之\d+號$", "號", s)  # 8之3號 → 8號（同一棟的分號）
    else:
        s = _FLOOR_TAIL.sub("", s)  # 沒有「號」：去掉樓層尾巴
    return s


def diversity(keys: pd.Series) -> dict:
    vc = keys[keys != ""].value_counts()
    count = int(len(vc))
    top_share = round(float(vc.iloc[0]) / int(vc.sum()), 2) if count else 0.0
    return {
        "buildingCount": count,
        "topBuildingShare": top_share,
        "lowDiversity": count < MIN_BUILDINGS or top_share > MAX_TOP_SHARE,
    }


def quantiles(s: pd.Series) -> dict:
    return {
        "median": int(round(s.median())),
        "p25": int(round(s.quantile(0.25))),
        "p75": int(round(s.quantile(0.75))),
    }


# ---------- 讀檔 ----------

def load() -> tuple[pd.DataFrame, list[str]]:
    files = sorted(ROOT.glob(RAW_GLOB))
    if not files:
        sys.exit(f"找不到原始資料：{RAW_GLOB}")
    frames, sources = [], []
    print("【讀檔】")
    for f in files:
        # 第 1 列中文欄名當表頭，第 2 列英文欄名跳過
        df = pd.read_excel(f, sheet_name=SHEET, engine="xlrd", header=0, skiprows=[1], dtype=str)
        missing = [c for c in REQUIRED_COLS if c not in df.columns]
        if missing:
            sys.exit(f"{f} 缺少欄位：{missing}")
        df["_source"] = f.parent.name
        frames.append(df)
        sources.append(f.parent.name)
        print(f"  {f.parent.name}  {len(df):>5} 筆")
    merged = pd.concat(frames, ignore_index=True)
    print(f"  合併            {len(merged):>5} 筆")
    return merged, sources


# ---------- 篩選 ----------

def clean(df: pd.DataFrame) -> pd.DataFrame:
    print("\n【篩選統計】")
    n0 = len(df)
    print(f"  {'原始合併':<14} {n0:>5} 筆")

    # 1. 編號去重
    n = len(df)
    df = df[df["編號"].notna()]
    df = df.drop_duplicates(subset="編號", keep="first")
    log_step("編號去重", n, len(df), "編號空白或跨期／同期重複（保留第一筆）")

    # 2. 交易標的
    print_counts("交易標的（去重後、篩選前）", df["交易標的"])
    n = len(df)
    dropped = df.loc[df["交易標的"] != TARGET_SUBJECT, "交易標的"].fillna("(空白)").value_counts()
    df = df[df["交易標的"] == TARGET_SUBJECT]
    print()
    log_step("交易標的", n, len(df), f"不是「{TARGET_SUBJECT}」")
    for k, v in dropped.items():
        print(f"{'':>18}- {k}：{v}")

    # 3. 建物型態
    print_counts("建物型態（交易標的篩選後、建物型態篩選前）", df["建物型態"])
    n = len(df)
    is_res = df["建物型態"].fillna("").str.startswith(RESIDENTIAL_PREFIXES)
    dropped = df.loc[~is_res, "建物型態"].fillna("(空白)").value_counts()
    df = df[is_res]
    print()
    log_step("建物型態", n, len(df), "非住宅類（住宅類：" + "／".join(RESIDENTIAL_PREFIXES) + "）")
    for k, v in dropped.items():
        print(f"{'':>18}- {k}：{v}")

    # 4. 數值
    df = df.copy()
    df["rent"] = pd.to_numeric(df["總額元"], errors="coerce")
    df["unit_m2"] = pd.to_numeric(df["單價元平方公尺"], errors="coerce")
    df["area_m2"] = pd.to_numeric(df["建物總面積平方公尺"], errors="coerce")

    n = len(df)
    df = df[df["rent"] > 0]
    log_step("總額元", n, len(df), "空白、非數字或 ≤ 0")

    n = len(df)
    df = df[(df["unit_m2"] > 0) & (df["area_m2"] > 0)]
    log_step("單價／面積", n, len(df), "單價元平方公尺或建物總面積空白、非數字或 ≤ 0")

    # 5. 日期
    df["contract_date"] = df["租賃年月日"].map(roc_to_date)
    n = len(df)
    df = df[df["contract_date"].notna()]
    log_step("租賃年月日", n, len(df), "無法解析為民國年月日")

    # 6. 行政區、出租型態
    n = len(df)
    df = df[df["鄉鎮市區"].notna() & df["出租型態"].notna()]
    df = df[(df["鄉鎮市區"].str.strip() != "") & (df["出租型態"].str.strip() != "")]
    log_step("區／出租型態", n, len(df), "行政區或出租型態空白")

    df["per_ping"] = df["unit_m2"] * PING_PER_M2
    df["_bkey"] = df["土地位置建物門牌"].map(building_key)
    print(f"  建物鍵：{df['_bkey'].nunique()} 棟（無法辨識門牌 {(df['_bkey'] == '').sum()} 筆）")
    print(f"\n  篩選後共 {len(df)} 筆（原始 {n0} 筆，累計篩掉 {n0 - len(df)} 筆）")

    print_counts("有無管理員（篩選後，僅供參考，不分組不輸出）", df["有無管理員"])
    print_counts("有無附傢俱（篩選後，僅供參考，不分組不輸出）", df["有無附傢俱"])
    return df


# ---------- 統計 ----------

def iqr_filter(g: pd.DataFrame) -> pd.DataFrame:
    q1, q3 = g["rent"].quantile(0.25), g["rent"].quantile(0.75)
    iqr = q3 - q1
    lo, hi = q1 - IQR_K * iqr, q3 + IQR_K * iqr
    return g[(g["rent"] >= lo) & (g["rent"] <= hi)]


def aggregate(df: pd.DataFrame) -> tuple[dict, list[dict]]:
    districts: dict[str, dict] = {}
    rows = []
    total_outliers = 0
    for (dist, rtype), g in df.groupby(["鄉鎮市區", "出租型態"], sort=True):
        kept = iqr_filter(g)
        n_raw, n = len(g), len(kept)
        removed = n_raw - n
        total_outliers += removed
        div = diversity(kept["_bkey"])
        rows.append({"district": dist, "type": rtype, "raw": n_raw, "kept": n, "removed": removed, **div})
        if n < MIN_SAMPLE:
            entry = {"insufficient": True, "sampleSize": n, "buildingCount": div["buildingCount"]}
        else:
            entry = {"sampleSize": n, "outliersRemoved": removed, "rent": quantiles(kept["rent"]), **div}
            if rtype not in ROOM_SHARE_TYPES:
                entry["perPing"] = quantiles(kept["per_ping"])
        districts.setdefault(dist, {})[rtype] = entry
    print(f"\n【離群值】IQR {IQR_K} 倍，共排除 {total_outliers} 筆")
    return districts, rows


def print_table(rows: list[dict]) -> None:
    types = sorted({r["type"] for r in rows})
    dists = sorted({r["district"] for r in rows})
    lookup = {(r["district"], r["type"]): r for r in rows}
    w0, w = 10, 14

    print(f"\n【樣本數表】排除離群值後樣本數（括號內為排除數）；* = 樣本數 < {MIN_SAMPLE}，標示不足")
    header = pad("行政區", w0) + "".join(pad(t, w, right=True) for t in types) + pad("合計", 8, right=True)
    print(header)
    print("-" * disp_width(header))
    col_tot = {t: 0 for t in types}
    for d in dists:
        cells, tot = [], 0
        for t in types:
            r = lookup.get((d, t))
            if r is None:
                cells.append(pad("-", w, right=True))
                continue
            mark = "*" if r["kept"] < MIN_SAMPLE else " "
            cells.append(pad(f"{r['kept']}({r['removed']}){mark}", w, right=True))
            tot += r["kept"]
            col_tot[t] += r["kept"]
        flag = "  ◀ 文山區" if d == HIGHLIGHT_DISTRICT else ""
        print(pad(d, w0) + "".join(cells) + pad(str(tot), 8, right=True) + flag)
    print("-" * disp_width(header))
    print(pad("合計", w0) + "".join(pad(str(col_tot[t]), w, right=True) for t in types)
          + pad(str(sum(col_tot.values())), 8, right=True))
    if HIGHLIGHT_DISTRICT not in dists:
        print(f"  ⚠ 資料中沒有 {HIGHLIGHT_DISTRICT}")

    print(f"\n【建物多樣性】每格：樣本數/棟數/最大一棟占比；⚠ = lowDiversity"
          f"（棟數 < {MIN_BUILDINGS} 或最大一棟占比 > {MAX_TOP_SHARE}，僅計樣本數 ≥ {MIN_SAMPLE}）")
    w = 18
    header = pad("行政區", w0) + "".join(pad(t, w, right=True) for t in types)
    print(header)
    print("-" * disp_width(header))
    for d in dists:
        cells = []
        for t in types:
            r = lookup.get((d, t))
            if r is None:
                cells.append(pad("-", w, right=True))
                continue
            mark = "⚠" if r["kept"] >= MIN_SAMPLE and r["lowDiversity"] else " "
            cells.append(pad(f"{r['kept']}/{r['buildingCount']}/{r['topBuildingShare']:.2f}{mark}", w, right=True))
        flag = "  ◀ 文山區" if d == HIGHLIGHT_DISTRICT else ""
        print(pad(d, w0) + "".join(cells) + flag)
    low = [r for r in rows if r["kept"] >= MIN_SAMPLE and r["lowDiversity"]]
    print(f"  lowDiversity 共 {len(low)} 組")


# ---------- 主程式 ----------

def main() -> None:
    raw, sources = load()
    df = clean(raw)
    districts, rows = aggregate(df)
    print_table(rows)

    d_min, d_max = min(df["contract_date"]), max(df["contract_date"])
    out = {
        "city": "臺北市",
        "period": {"from": d_min.isoformat(), "to": d_max.isoformat()},
        "periodNote": PERIOD_NOTE,
        "sources": sources,
        "generatedAt": datetime.now(ZoneInfo("Asia/Taipei")).isoformat(timespec="seconds"),
        "dataSource": "內政部實價登錄（租賃）",
        "minSampleSize": MIN_SAMPLE,
        "method": METHOD_NOTE,
        "districts": districts,
    }
    text = json.dumps(out, ensure_ascii=False, indent=2)

    # 防呆：輸出不得含地址、門牌
    if re.search(r"[路街巷弄號]", text):
        sys.exit("輸出疑似含地址或門牌字樣，已中止寫檔")

    OUT_PATH.write_text(text + "\n", encoding="utf-8")
    print(f"\n【輸出】{OUT_PATH.relative_to(ROOT)}｜期間 {d_min} ～ {d_max}｜{len(districts)} 個行政區")


if __name__ == "__main__":
    main()
