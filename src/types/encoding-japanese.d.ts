declare module 'encoding-japanese' {
  export function detect(data: Uint8Array | number[]): string | boolean
  export function convert(
    data: Uint8Array | number[],
    options: {
      to: string
      from?: string
      type?: string
    }
  ): number[] | Uint8Array | string
  export function codeToString(data: number[] | Uint8Array): string
  export function stringToCode(str: string): number[]
}
