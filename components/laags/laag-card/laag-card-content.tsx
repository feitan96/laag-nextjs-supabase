import { CardContent } from "@/components/ui/card"
import type { Laag } from "@/types"
import { DollarSign, MapPin } from "lucide-react"
import { ImageGallery } from "../image-gallery"

interface LaagCardContentProps {
  laag: Laag
}

export function LaagCardContent({ laag }: LaagCardContentProps) {
  return (
    <CardContent className="pb-0">
      <h3 className="text-xl font-semibold mb-2">{laag.what}</h3>

      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span>{laag.where}</span>
      </div>

      {laag.why && (
        <div className="mb-4">
          <p className="whitespace-pre-wrap text-sm">{laag.why}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Estimated</p>
            <p className="font-medium">₱{laag.estimated_cost.toFixed(2)}</p>
          </div>
        </div>

        {laag.actual_cost !== null && (
          <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="font-medium">₱{laag.actual_cost.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {laag.laagImages && laag.laagImages.filter((img) => !img.is_deleted).length > 0 && (
        <div className="w-full overflow-hidden rounded-lg">
          <ImageGallery images={laag.laagImages} />
        </div>
      )}
    </CardContent>
  )
}
