// F3 示範合約文字：展示模式（F1）與 scripts/test-contract-rules.mjs 共用，內容為虛構示範。
export type ContractSample = {
  id: string;
  title: string;
  description: string;
  text: string;
};

export const contractSamples: readonly ContractSample[] = [
  {
    id: "text-common-risks",
    title: "示範合約文字 A：常見爭議條款",
    description: "押金、修繕、戶籍、補貼、終止、轉租",
    text: [
      "第三條 承租人應繳納三個月押金，作為履約擔保。",
      "第四條 室內所有設備損壞由承租人自行負責修繕。",
      "第五條 承租人不得將戶籍遷入本租賃住宅，亦不得申請租金補貼。",
      "第六條 房東得於一個月前通知承租人終止租約。",
      "第七條 未經房東同意不得轉租。",
    ].join("\n"),
  },
  {
    id: "text-invalid-clauses",
    title: "示範合約文字 B：範本明載無效的條款",
    description: "廣告、審閱期、稅賦、繳回契約書、通知方式等",
    text: [
      "第一條 本物件廣告內容僅供參考。",
      "第二條 承租人同意拋棄契約審閱期間。",
      "第三條 房屋稅、地價稅如有增加，增加部分由承租人負擔。",
      "第四條 租期屆滿時承租人應將契約書繳回出租人。",
      "第五條 雙方之通知僅以電話方式為之。",
      "第六條 承租人不得申報租賃費用支出。",
      "第七條 租期屆滿押金概不退還。",
      "第八條 未於一個月前通知即終止租約者，應賠償三個月租金之違約金。",
    ].join("\n"),
  },
  {
    id: "text-template-like",
    title: "示範合約文字 C：貼近範本的條款",
    description: "規則沒有命中，用來說明「沒命中不等於沒問題」",
    text: [
      "第三條 押金為二個月租金總額。",
      "第四條 租期屆滿返還住宅時，出租人應返還押金。",
      "第五條 房屋稅、地價稅由出租人負擔。",
      "第六條 承租人經出租人同意始得轉租。",
      "第七條 人為損壞由承租人負責修繕，其餘由出租人負責。",
    ].join("\n"),
  },
];
