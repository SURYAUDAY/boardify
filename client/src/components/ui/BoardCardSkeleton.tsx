export default function BoardCardSkeleton() {
  return (
    <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden">
      <div className="h-[160px] bg-slate-800 animate-pulse rounded-t-2xl" />
      <div className="p-5">
        <div className="h-3.5 w-3/5 bg-slate-700 rounded animate-pulse" />
        <div className="h-2.5 w-2/5 bg-slate-700 rounded animate-pulse mt-1.5" />
        <div className="flex mt-4">
          <div className="w-5 h-5 bg-slate-700 rounded-full" />
          <div className="w-5 h-5 bg-slate-700 rounded-full -ml-2" />
          <div className="w-5 h-5 bg-slate-700 rounded-full -ml-2" />
        </div>
      </div>
    </div>
  );
}
