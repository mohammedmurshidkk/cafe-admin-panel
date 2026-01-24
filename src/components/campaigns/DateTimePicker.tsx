import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
}

export function DateTimePicker({ date, setDate, className }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
    const [hour, setHour] = React.useState<string>(date ? format(date, 'HH') : '12');
    const [minute, setMinute] = React.useState<string>(date ? format(date, 'mm') : '00');

    React.useEffect(() => {
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(parseInt(hour, 10));
            newDate.setMinutes(parseInt(minute, 10));
            setDate(newDate);
        } else {
            setDate(undefined);
        }
    }, [selectedDate, hour, minute]);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal h-10',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP HH:mm') : <span>Pick a date and time</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                    <div className="p-3 border-t flex items-center gap-2 justify-center bg-muted/20">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-1">
                            <Select value={hour} onValueChange={setHour}>
                                <SelectTrigger className="w-[65px] h-8">
                                    <SelectValue placeholder="HH" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hours.map((h) => (
                                        <SelectItem key={h} value={h}>
                                            {h}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm font-medium">:</span>
                            <Select value={minute} onValueChange={setMinute}>
                                <SelectTrigger className="w-[65px] h-8">
                                    <SelectValue placeholder="mm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {minutes.map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
