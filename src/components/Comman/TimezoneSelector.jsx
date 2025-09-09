import React, {Fragment, useRef, useState} from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {timeZoneJson} from "../../utils/constent";

const TimezoneSelector = ({ timezone, onChange, }) => {
    const [open, setOpen] = useState(false);
    const listRef = useRef(null);

    const handleWheelScroll = (event) => {
        if (listRef.current) {
            listRef.current.scrollTop += event.deltaY;
        }
    };

    const handleTouchScroll = (e) => {
        e.stopPropagation();
    };

    return (
        <Fragment>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-10 bg-card hover:bg-card"
                    >
                        {timezone
                            ? timeZoneJson.find((x) => x.tzCode === timezone)?.label || timezone
                            : "Select time zone"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full max-w-[414px] min-w-[--radix-popover-trigger-width] p-0">
                    <Command className={'w-full'}>
                        <CommandInput placeholder="Search time zone..." />
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandList>
                        <CommandGroup className={'max-h-[200px] overflow-y-auto'} ref={listRef} onWheel={handleWheelScroll} onTouchMove={handleTouchScroll}>
                            {(timeZoneJson || []).map((tz) => (
                                <CommandItem
                                    key={tz.tzCode}
                                    value={tz.label} className={'cursor-pointer'}
                                    onSelect={() => {
                                        onChange("timezone", tz.tzCode);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            timezone === tz.tzCode ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tz.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </Fragment>
    );
};

export default TimezoneSelector;
