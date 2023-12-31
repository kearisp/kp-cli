export interface Logger {
    log(...args: any[]): void
    info(...args: any[]): void
    warning(...args: any[]): void
    error(...args: any[]): void
}
