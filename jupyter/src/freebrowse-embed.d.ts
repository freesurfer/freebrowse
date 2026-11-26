declare module "*freebrowse-embed.js" {
  export interface NiiVueLike {
    volumes?: unknown[];
    canvas?: HTMLCanvasElement | null;
    resize?: () => void;
    destroy?: () => void;
    addVolume?: (volume: { url: string | File; name?: string }) => Promise<unknown>;
  }

  export interface FreeBrowseConfig {
    backend: { dataUrl: string; aiUrl: string } | null;
    downloadDisabled: boolean;
    persist: string | false;
    readUrlParams: boolean;
    exposeGlobal: boolean;
    allowExternalDocumentUrls: boolean;
  }

  export interface MountOptions {
    nv?: NiiVueLike;
    backend?: null;
    persist?: string | false;
    readUrlParams?: boolean;
    exposeGlobal?: boolean;
    downloadDisabled?: boolean;
    allowExternalDocumentUrls?: boolean;
    dragDrop?: boolean;
    sidebar?: boolean;
    footer?: boolean;
  }

  export interface FreeBrowseHandle {
    nv: NiiVueLike;
    config: Readonly<FreeBrowseConfig>;
    loadFile(file: File, signal?: AbortSignal): Promise<void>;
    loadVolumeUrl(url: string, filename: string, signal?: AbortSignal): Promise<void>;
    destroy(): void;
  }

  export function mountFreeBrowse(
    container: HTMLElement,
    options?: MountOptions
  ): FreeBrowseHandle;
}

declare module "*.css" {}
