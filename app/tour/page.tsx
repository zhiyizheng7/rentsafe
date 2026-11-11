import { TourExperience } from "@/components/tour-experience";

export default function TourPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="space-y-4">
        <p className="eyebrow">情境看房</p>
        <h1 className="font-serif text-5xl leading-tight text-[color:var(--text-primary)]">先像實地看房一樣走一圈</h1>
        <p className="max-w-3xl text-base leading-8 text-[color:var(--text-secondary)]">
          點開每個標記，看看簽約前要請房東確認什麼。這裡不計分，看完再交給 RentSafe 查核。
        </p>
      </section>

      <TourExperience />
    </div>
  );
}
