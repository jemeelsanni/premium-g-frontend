/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Safely format a date value to a localized date string
 */
export const formatDate = (
    value: any,
    options?: Intl.DateTimeFormatOptions
): string => {
    // Handle null, undefined, empty string
    if (!value || value === '') return 'N/A';
    
    try {
        // Handle if it's already a Date object
        let date: Date;
        
        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string' || typeof value === 'number') {
            date = new Date(value);
        } else {
            console.warn('Unexpected date value type:', typeof value, value);
            return 'Invalid Date';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date value:', value);
            return 'Invalid Date';
        }
        
        return date.toLocaleDateString('en-US', options || {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error, 'for value:', value);
        return 'Invalid Date';
    }
};

export const formatDateTime = (value: any): string => {
    return formatDate(value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};