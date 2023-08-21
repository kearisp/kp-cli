export interface Logger {
    info(...args: any[]): void
    warning(...args: any[]): void
    error(...args: any[]): void
}
