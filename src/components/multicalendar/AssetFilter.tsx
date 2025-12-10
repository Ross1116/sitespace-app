import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface AssetFilterProps {
  isCollapsed: boolean;
  loading: boolean;
  assetCalendars: AssetCalendar[];
  visibleAssets: number[];
  setVisibleAssets: React.Dispatch<React.SetStateAction<number[]>>;
}

export function AssetFilter({
  isCollapsed,
  loading,
  assetCalendars,
  visibleAssets,
  setVisibleAssets,
}: AssetFilterProps) {
  const toggleAssetVisibility = (assetIndex: number) => {
    setVisibleAssets((prevVisible) => {
      if (prevVisible.includes(assetIndex)) {
        return prevVisible.filter((index) => index !== assetIndex);
      } else {
        return [...prevVisible, assetIndex];
      }
    });
  };

  return (
    <Card
      className={`${
        isCollapsed ? "lg:hidden" : "col-span-3 lg:flex"
      } row-span-3 overflow-hidden hidden bg-white border border-slate-100 shadow-sm rounded-2xl transition-all duration-600 px-4`}
    >
      <CardHeader>
        <CardTitle className="text-slate-900">Assets Filter</CardTitle>
        <CardDescription className="text-slate-500">
          Choose which assets you would like to view
        </CardDescription>
      </CardHeader>
      <CardContent className="-mt-2 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-full bg-slate-100" />
            ))}
          </div>
        ) : assetCalendars.length === 0 ? (
          <p className="text-slate-500 text-sm">No assets available</p>
        ) : (
          <div className="flex flex-col justify-evenly space-y-2">
            {assetCalendars.map((calendar: any, index) => {
              const assetName = calendar.asset?.name || calendar.name || "Unknown Asset";
              const assetCode = calendar.asset?.asset_code || calendar.asset_code || "";
              
              return (
                <div key={index} className="flex items-center space-x-2 group">
                  <Checkbox
                    id={`asset-${index}`}
                    checked={visibleAssets.includes(index)}
                    onCheckedChange={() => toggleAssetVisibility(index)}
                    className="border-slate-300 data-[state=checked]:bg-[#0B1120] data-[state=checked]:border-[#0B1120]"
                  />
                  <label
                    htmlFor={`asset-${index}`}
                    className="text-sm font-medium text-slate-700 truncate cursor-pointer group-hover:text-[#0B1120] transition-colors select-none"
                    title={assetCode ? `${assetName} (${assetCode})` : assetName}
                  >
                    {assetName}
                    {assetCode && (
                      <span className="ml-1 text-xs text-slate-400 font-normal">
                        ({assetCode})
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}