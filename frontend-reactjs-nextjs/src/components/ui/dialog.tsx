import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

interface DialogContentProps {
    children: React.ReactNode;
    className?: string;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
    );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ children, className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'relative z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden bg-background rounded-lg shadow-2xl border border-border',
                    className
                )}
                {...props}
            >
                <div className="overflow-y-auto max-h-[85vh] p-6">
                    {children}
                </div>
            </div>
        );
    }
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'flex flex-col space-y-1.5 text-center sm:text-left mb-4',
                className
            )}
        >
            {children}
        </div>
    );
};

const DialogTitle = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <h2
            className={cn(
                'text-lg font-semibold leading-none tracking-tight',
                className
            )}
        >
            {children}
        </h2>
    );
};

const DialogDescription = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <p className={cn('text-sm text-muted-foreground', className)}>
            {children}
        </p>
    );
};

const DialogClose = ({ onClose }: { onClose: () => void }) => {
    return (
        <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-accent hover:text-accent-foreground p-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
        </button>
    );
};

const DialogFooter = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6',
                className
            )}
        >
            {children}
        </div>
    );
};

const DialogTrigger = React.forwardRef<
    HTMLDivElement,
    { children: React.ReactNode; asChild?: boolean; onClick?: () => void }
>(({ children, asChild, onClick }, ref) => {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                onClick?.();
                (children as React.ReactElement<any>).props.onClick?.(e);
            },
        });
    }
    return (
        <div ref={ref} onClick={onClick}>
            {children}
        </div>
    );
});
DialogTrigger.displayName = 'DialogTrigger';

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogFooter,
    DialogTrigger,
};
