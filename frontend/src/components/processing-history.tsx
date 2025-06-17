"use client"
import { Clock, CheckCircle, XCircle, Hourglass, Eye, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { NVDocument, ExportDocumentData } from "@niivue/niivue"

export type ProcessingStatus = "pending" | "completed" | "failed"

export interface ProcessingHistoryItem {
  id: string
  timestamp: Date
  nvDocument: ExportDocumentData
  toolName: string
  status: ProcessingStatus
  result?: NVDocument
  error?: string
}

interface ProcessingHistoryProps {
  history: ProcessingHistoryItem[]
  onViewResult?: (item: ProcessingHistoryItem) => void
  onDeleteItem?: (id: string) => void
  onClearHistory?: () => void
}

export default function ProcessingHistory({
  history,
  onViewResult,
  onDeleteItem,
  onClearHistory,
}: ProcessingHistoryProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return <Hourglass className="h-4 w-4 text-yellow-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Failed
          </Badge>
        )
    }
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">No processing history</h3>
        <p className="text-sm">Your processing history will appear here after you process images.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b">
        <h3 className="font-medium">Processing History</h3>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearHistory}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {history.map((item) => (
            <div key={item.id} className="mb-3 last:mb-0">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(item.status)}
                    <span className="ml-2 font-medium text-sm">{item.toolName}</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="text-xs text-muted-foreground mb-2">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 inline" />
                    {formatDate(item.timestamp)}
                  </span>
                </div>

                <div className="text-xs mb-3">
                  <span className="text-muted-foreground">Scene: </span>
                  <span>
                    {item.id}
                  </span>
                </div>

                {item.status === "completed" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onViewResult && onViewResult(item)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Result
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}

                {item.status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500"
                    onClick={() => onDeleteItem && onDeleteItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
