'use client'

import * as React from 'react'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { DayButton, DayPicker, getDefaultClassNames } from 'react-day-picker'

import { cn } from '~/utils/lib'
import { Button, buttonVariants } from './button'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  startMonth = new Date(1900, 0),
  endMonth = new Date(new Date().getFullYear() + 10, 11),
  buttonVariant = 'ghost',
  formatters,
  components,
  month,
  defaultMonth,
  onMonthChange,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  const [view, setView] = React.useState<'days' | 'months' | 'years'>('days');
  const [internalMonth, setInternalMonth] = React.useState<Date>(month || defaultMonth || new Date());

  React.useEffect(() => {
    if (month) setInternalMonth(month);
  }, [month]);

  const currentMonth = month || internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  if (view === 'months') {
    return (
      <div className={cn("p-4 bg-white w-[300px]", className)}>
        <div className="flex justify-between items-center mb-4">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-[#1E40AF] border-[#BFDBFE] hover:bg-[#F0F6FF]" onClick={() => handleMonthChange(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()))}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <button type="button" onClick={() => setView('years')} className="font-semibold text-[15px] hover:text-[#1E40AF] transition-colors text-blue-900 px-3 py-1.5 rounded-md hover:bg-[#F0F6FF]">
            {currentMonth.getFullYear()}
          </button>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-[#1E40AF] border-[#BFDBFE] hover:bg-[#F0F6FF]" onClick={() => handleMonthChange(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()))}>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Button
              key={i}
              type="button"
              variant={i === currentMonth.getMonth() ? "default" : "ghost"}
              className={cn("h-12 font-medium text-[15px] transition-colors rounded-lg", i === currentMonth.getMonth() ? "bg-[#0A2463] text-white hover:bg-[#071A49] shadow-md" : "hover:bg-[#F0F6FF] text-gray-700 hover:text-[#0A2463]")}
              onClick={() => {
                handleMonthChange(new Date(currentMonth.getFullYear(), i));
                setView('days');
              }}
            >
              Thg {i + 1}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'years') {
    const currentYear = currentMonth.getFullYear();
    const startYear = currentYear - (currentYear % 12);
    return (
      <div className={cn("p-4 bg-white w-[300px]", className)}>
        <div className="flex justify-between items-center mb-4">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-[#1E40AF] border-[#BFDBFE] hover:bg-[#F0F6FF]" onClick={() => handleMonthChange(new Date(startYear - 12, currentMonth.getMonth()))}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <div className="font-semibold text-[15px] text-blue-900 px-3 py-1.5">
            {startYear} - {startYear + 11}
          </div>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-[#1E40AF] border-[#BFDBFE] hover:bg-[#F0F6FF]" onClick={() => handleMonthChange(new Date(startYear + 12, currentMonth.getMonth()))}>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const year = startYear + i;
            return (
              <Button
                key={year}
                type="button"
                variant={year === currentYear ? "default" : "ghost"}
                className={cn("h-12 font-medium text-[15px] transition-colors rounded-lg", year === currentYear ? "bg-[#0A2463] text-white hover:bg-[#071A49] shadow-md" : "hover:bg-[#F0F6FF] text-gray-700 hover:text-[#0A2463]")}
                onClick={() => {
                  handleMonthChange(new Date(year, currentMonth.getMonth()));
                  setView('months');
                }}
              >
                {year}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <DayPicker
      month={currentMonth}
      onMonthChange={handleMonthChange}
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-white group/calendar p-4 w-[300px] [--cell-size:2.2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout="label"
      startMonth={startMonth}
      endMonth={endMonth}
      formatters={{
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months
        ),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 pointer-events-none',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-8 w-8 select-none p-0 aria-disabled:opacity-50 text-[#1E40AF] hover:bg-[#F0F6FF] border border-[#BFDBFE] ml-1 pointer-events-auto',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'h-8 w-8 select-none p-0 aria-disabled:opacity-50 text-[#1E40AF] hover:bg-[#F0F6FF] border border-[#BFDBFE] mr-1 pointer-events-auto',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex h-8 w-full items-center justify-center',
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          'select-none font-medium text-sm',
          defaultClassNames.caption_label
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-blue-900 flex-1 select-none rounded-md text-[0.8rem] font-bold uppercase',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn(
          'w-[--cell-size] select-none',
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          'text-muted-foreground select-none text-[0.8rem]',
          defaultClassNames.week_number
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
          defaultClassNames.day
        ),
        range_start: cn(
          'bg-accent rounded-l-md',
          defaultClassNames.range_start
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('bg-accent rounded-r-md', defaultClassNames.range_end),
        today: cn(
          'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        CaptionLabel: (props) => {
          return (
            <div className="flex items-center gap-1.5 font-medium text-sm text-blue-900 relative z-10">
              <button 
                type="button" 
                onClick={() => setView('months')} 
                className="hover:text-[#1E40AF] transition-colors px-2.5 py-1 rounded-md hover:bg-[#F0F6FF] font-semibold text-[15px] cursor-pointer pointer-events-auto"
              >
                Tháng {currentMonth.getMonth() + 1}
              </button>
              <button 
                type="button" 
                onClick={() => setView('years')} 
                className="hover:text-[#1E40AF] transition-colors px-2.5 py-1 rounded-md hover:bg-[#F0F6FF] font-semibold text-[15px] cursor-pointer pointer-events-auto"
              >
                {currentMonth.getFullYear()}
              </button>
            </div>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const isSelected = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;

  return (
    <DayButton
      day={day}
      modifiers={modifiers}
      className={cn(
        'flex items-center justify-center aspect-square h-[--cell-size] w-[--cell-size] font-normal leading-none transition-colors rounded-md mx-auto',
        modifiers.today && !isSelected && 'text-[#1E40AF] font-bold',
        isSelected && 'bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white font-medium shadow-md',
        modifiers.range_start && 'bg-[#0A2463] text-white rounded-l-md hover:bg-[#071A49] hover:text-white',
        modifiers.range_end && 'bg-[#0A2463] text-white rounded-r-md hover:bg-[#071A49] hover:text-white',
        modifiers.range_middle && 'bg-[#F0F6FF] text-blue-900 rounded-none hover:bg-[#E8EDF5]',
        modifiers.focused && 'ring-2 ring-[#1E40AF] ring-offset-2',
        !isSelected && !modifiers.today && 'hover:bg-slate-100 hover:text-slate-900',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
