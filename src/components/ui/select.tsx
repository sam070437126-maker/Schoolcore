import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value: string;
  onValueChange: (val: string, labelNode?: React.ReactNode) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLabel: React.ReactNode;
  setSelectedLabel: React.Dispatch<React.SetStateAction<React.ReactNode>>;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

export interface SelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Select: React.FC<SelectProps> = ({
  children,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
}) => {
  const [internalValue, setInternalValue] = React.useState<string>(
    controlledValue !== undefined ? controlledValue : defaultValue
  );
  const [open, setOpen] = React.useState<boolean>(false);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>(null);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (val: string, labelNode?: React.ReactNode) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    if (labelNode) {
      setSelectedLabel(labelNode);
    }
    onValueChange?.(val);
    setOpen(false);
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { id?: string }
>(({ className, children, id, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      type="button"
      id={id}
      ref={ref}
      onClick={() => context.setOpen((prev) => !prev)}
      aria-expanded={context.open}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({
  placeholder = "Select an option",
  className,
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  return (
    <span className={cn("block truncate text-left", className)}>
      {context.selectedLabel || context.value || placeholder}
    </span>
  );
};

const SelectContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-80 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50",
        className
      )}
    >
      {children}
    </div>
  );
};

const SelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  const isSelected = context.value === value;

  // Set initial selectedLabel if matches value and not set yet
  React.useEffect(() => {
    if (isSelected && !context.selectedLabel) {
      context.setSelectedLabel(children);
    }
  }, [isSelected, children]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => context.onValueChange(value, children)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 px-2 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        isSelected && "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50",
        className
      )}
    >
      <span className="flex-1 flex items-center gap-2">{children}</span>
      {isSelected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 ms-2" />}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
