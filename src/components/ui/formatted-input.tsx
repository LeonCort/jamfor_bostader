"use client";

import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Input } from "@/components/ui/input";

// Base wrapper that renders a NumericFormat using our shadcn Input for styling
const BaseFormattedInput = React.forwardRef<HTMLInputElement, NumericFormatProps>(
  ({ ...props }, ref) => {
    return (
      <NumericFormat
        {...props}
        getInputRef={ref}
        customInput={Input}
        type="text"
      />
    );
  }
);
BaseFormattedInput.displayName = "BaseFormattedInput";

// Currency input for SEK using Swedish formatting rules
const CurrencyInput = React.forwardRef<HTMLInputElement, NumericFormatProps>(
  ({ thousandSeparator = " ", decimalSeparator = ",", decimalScale = 2, fixedDecimalScale = true, allowNegative = false, inputMode = "decimal", ...props }, ref) => (
    <BaseFormattedInput
      {...props}
      getInputRef={ref}
      thousandSeparator={thousandSeparator}
      decimalSeparator={decimalSeparator}
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      allowNegative={allowNegative}
      inputMode={inputMode as any}
    />
  )
);
CurrencyInput.displayName = "CurrencyInput";

// Percentage input with comma decimals (no thousand separator)
const PercentInput = React.forwardRef<HTMLInputElement, NumericFormatProps>(
  ({ thousandSeparator = false as any, decimalSeparator = ",", decimalScale = 2, fixedDecimalScale = true, allowNegative = false, inputMode = "decimal", ...props }, ref) => (
    <BaseFormattedInput
      {...props}
      getInputRef={ref}
      thousandSeparator={thousandSeparator}
      decimalSeparator={decimalSeparator}
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      allowNegative={allowNegative}
      inputMode={inputMode as any}
    />
  )
);
PercentInput.displayName = "PercentInput";

export { CurrencyInput, PercentInput };

