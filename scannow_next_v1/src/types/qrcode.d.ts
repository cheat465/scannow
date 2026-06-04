declare module "qrcode" {
  type ToDataUrlOptions = {
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  };

  export function toDataURL(
    text: string,
    options?: ToDataUrlOptions
  ): Promise<string>;
}
