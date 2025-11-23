import * as React from 'react';
import { Input } from './input';

export interface DateInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, label, ...props }, ref) => {
        return <Input type="date" className={className} ref={ref} {...props} />;
    }
);
DateInput.displayName = 'DateInput';

export { DateInput };
