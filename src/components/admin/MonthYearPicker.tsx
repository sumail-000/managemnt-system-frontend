import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface MonthYearPickerProps {
  selectedMonth: number
  selectedYear: number
  onDateChange: (month: number, year: number) => void
  className?: string
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function MonthYearPicker({ 
  selectedMonth, 
  selectedYear, 
  onDateChange, 
  className = "" 
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempMonth, setTempMonth] = useState(selectedMonth)
  const [tempYear, setTempYear] = useState(selectedYear)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i + 1)

  const handleApply = () => {
    onDateChange(tempMonth, tempYear)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempMonth(selectedMonth)
    setTempYear(selectedYear)
    setIsOpen(false)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (tempMonth === 1) {
        setTempMonth(12)
        setTempYear(tempYear - 1)
      } else {
        setTempMonth(tempMonth - 1)
      }
    } else {
      if (tempMonth === 12) {
        setTempMonth(1)
        setTempYear(tempYear + 1)
      } else {
        setTempMonth(tempMonth + 1)
      }
    }
  }

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label
  const displayText = `${selectedMonthName} ${selectedYear}`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Calendar className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Month & Year</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Quick Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold">
              {months.find(m => m.value === tempMonth)?.label} {tempYear}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select
              value={tempMonth.toString()}
              onValueChange={(value) => setTempMonth(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select
              value={tempYear.toString()}
              onValueChange={(value) => setTempYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  setTempMonth(now.getMonth() + 1)
                  setTempYear(now.getFullYear())
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastMonth = new Date()
                  lastMonth.setMonth(lastMonth.getMonth() - 1)
                  setTempMonth(lastMonth.getMonth() + 1)
                  setTempYear(lastMonth.getFullYear())
                }}
              >
                Last Month
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}