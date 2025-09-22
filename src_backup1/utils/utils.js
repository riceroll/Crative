export function convertToInches(displayValue, useInch) {
    return useInch ? displayValue : (displayValue / 2.54);
}

export function convertToDisplay(value, useInch) {
    let displayInch = parseFloat( Number(value).toFixed(2)).toString();
    let displayCm = parseFloat(Number(value * 2.54).toFixed(1)).toString();



    return useInch ? displayInch : displayCm;
}