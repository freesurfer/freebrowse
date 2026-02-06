import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from "@jupyterlab/application";
import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget,
} from "@jupyterlab/docregistry";
import { PageConfig } from "@jupyterlab/coreutils";
import { Widget } from "@lumino/widgets";

const FACTORY = "FreeBrowse";

/**
 * Content widget that renders a NIfTI file inside a FreeBrowse iframe.
 */
class FreeBrowseContent extends Widget {
  constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
    super();
    this.addClass("jp-FreeBrowseWidget");

    const baseUrl = PageConfig.getBaseUrl();
    const filePath = context.path;

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.src = `${baseUrl}freebrowse/?vol=${baseUrl}files/${filePath}`;

    this.node.appendChild(iframe);
  }
}

/**
 * Widget factory that creates DocumentWidgets containing FreeBrowse iframes.
 */
class FreeBrowseFactory extends ABCWidgetFactory<
  DocumentWidget<FreeBrowseContent>,
  DocumentRegistry.IModel
> {
  protected createNewWidget(
    context: DocumentRegistry.IContext<DocumentRegistry.IModel>
  ): DocumentWidget<FreeBrowseContent> {
    const content = new FreeBrowseContent(context);
    return new DocumentWidget({ content, context });
  }
}

/**
 * JupyterLab plugin that registers FreeBrowse as a viewer for NIfTI files.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab-freebrowse:plugin",
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    // Register file types
    app.docRegistry.addFileType({
      name: "nifti",
      displayName: "NIfTI Image",
      extensions: [".nii"],
      mimeTypes: ["application/octet-stream"],
      fileFormat: "base64",
    });
    app.docRegistry.addFileType({
      name: "nifti-gz",
      displayName: "NIfTI Image (compressed)",
      extensions: [".nii.gz"],
      mimeTypes: ["application/gzip"],
      fileFormat: "base64",
    });

    // Register the widget factory
    const factory = new FreeBrowseFactory({
      name: FACTORY,
      label: "FreeBrowse",
      modelName: "base64",
      fileTypes: ["nifti", "nifti-gz"],
      defaultFor: ["nifti", "nifti-gz"],
      readOnly: true,
    });

    app.docRegistry.addWidgetFactory(factory);

    console.log("jupyterlab-freebrowse extension activated");
  },
};

export default plugin;
