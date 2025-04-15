"use client"

import { type ReactNode, useEffect } from "react"

// Define the scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d4d4d8;
    border-radius: 20px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #a1a1aa;
  }

  /* Prevent body scrolling */
  body {
    overflow: hidden;
  }
`

interface FeedLayoutProps {
  leftSidebar: ReactNode
  mainContent: ReactNode
  rightSidebar: ReactNode
}

export function FeedLayout({ leftSidebar, mainContent, rightSidebar }: FeedLayoutProps) {
  // Add the scrollbar styles to the document
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.innerHTML = scrollbarStyles
    document.head.appendChild(styleElement)

    return () => {
      // Clean up the style element when the component unmounts
      document.head.removeChild(styleElement)
    }
  }, [])

  return (
    <div className="h-screen overflow-hidden">
      <div className="container py-6 h-full px-0 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-[300px_640px_300px] gap-6 h-full w-full justify-center max-w-[1400px] mx-auto">
          {/* Left Sidebar - Sticky */}
          <div className="h-full hidden md:block">
            <div className="sticky top-6">{leftSidebar}</div>
          </div>

          {/* Center Main Content - Scrollable */}
          <div className="h-full overflow-y-auto custom-scrollbar w-[640px]">
            <div className="space-y-6 w-full">{mainContent}</div>
          </div>

          {/* Right Sidebar - Sticky */}
          <div className="h-full hidden md:block">
            <div className="sticky top-6">{rightSidebar}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
