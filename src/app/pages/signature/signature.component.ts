import {
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { QuillEditorComponent } from 'ngx-quill';
import * as QuillNamespace from 'quill';
import BlotFormatter from 'quill-blot-formatter';
import { AssetsManagerComponent } from '@components/assets-manager/assets-manager.component';
import { UserService } from '@services/user.service';
import { User } from '@models/user.model';
import { QuillEditor } from '@constants/variable.constants';
import { addTable } from '@utils/quill-table';
import { initSignatureTemplate } from '@app/helper';
import { ToastrService } from 'ngx-toastr';
const Quill: any = QuillNamespace;

Quill.register('modules/blotFormatter', BlotFormatter);
const Parchment = Quill.import('parchment');
const ImageBlot = Quill.import('formats/image');
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ['0.75em', '1.5em', '2em'];
Quill.register(SizeStyle, true);
const FontStyle = Quill.import('attributors/style/font');
FontStyle.whitelist = [
  'arial',
  'times new roman',
  'monospace',
  'arial black',
  'arial narrow',
  'comic sans ms',
  'garamond',
  'georgia',
  'tahoma',
  'trebuchet ms',
  'verdana'
];
Quill.register(FontStyle, true);
const Block = Quill.import('blots/block');
Block.tagName = 'DIV';
Quill.register(Block, true);
const ImageFormatAttributesList = ['alt', 'height', 'width', 'style'];

class ImageFormat extends ImageBlot {
  static formats(domNode) {
    return ImageFormatAttributesList.reduce(function (formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
  format(name, value) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}
Quill.register(ImageFormat, true);
@Component({
  selector: 'app-signature',
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss']
})
export class SignatureComponent implements OnInit, OnDestroy {
  user: User = new User();
  templates = [
    { layout: 'img_text_hor', icon: 'i-signature-1' },
    { layout: 'text_img_hor', icon: 'i-signature-2' },
    { layout: 'text_img_ver', icon: 'i-signature-3' },
    { layout: 'img_text_ver', icon: 'i-signature-4' }
  ];
  currentTemplate = '';
  emailSignature = '';
  submitted = false;
  saving = false;
  generating = false;

  quillEditorRef;
  config = {
    ...QuillEditor,
    table: true
  };
  table: any;

  @ViewChild('emailEditor') emailEditor: QuillEditorComponent;

  profileSubscription: Subscription;

  constructor(
    private userService: UserService,
    private zone: NgZone,
    private dialog: MatDialog,
    private toast: ToastrService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.user = profile;
          if (!this.user.email_signature) {
            this.user.email_signature = '';
          }
          this.emailSignature = this.correctEmailContent(
            this.user.email_signature || ''
          );
          if (this.quillEditorRef) {
            try {
              const delta = this.quillEditorRef.clipboard.convert(
                this.user.email_signature || ''
              );
              this.emailEditor.quillEditor.setContents(delta, 'user');
            } catch (_) {}
          }
        }
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  changeTemplate(template: any): void {
    let imageCell = '';
    let dataCell = '';

    // change header text to normal text
    const tempDom = document.createElement('div');
    tempDom.innerHTML = this.emailSignature;
    const h1Doms = tempDom.querySelectorAll('h1');
    const h2Doms = tempDom.querySelectorAll('h2');
    const h3Doms = tempDom.querySelectorAll('h3');
    const h4Doms = tempDom.querySelectorAll('h4');
    const h5Doms = tempDom.querySelectorAll('h5');
    const h6Doms = tempDom.querySelectorAll('h6');
    h1Doms.forEach((e) => {
      const newDom = document.createElement('div');
      newDom.innerHTML = `<span style="font-size: 2rem;">${e.innerHTML}</span>`;
      e.replaceWith(newDom);
    });
    h2Doms.forEach((e) => {
      const newDom = document.createElement('div');
      newDom.innerHTML = `<span style="font-size: 2rem;">${e.innerHTML}</span>`;
      e.replaceWith(newDom);
    });
    h3Doms.forEach((e) => {
      const newDom = document.createElement('div');
      newDom.innerHTML = `<span style="font-size: 1.5rem;">${e.innerHTML}</span>`;
      e.replaceWith(newDom);
    });
    h4Doms.forEach((e) => {
      const newDom = document.createElement('div');
      newDom.innerHTML = `${e.innerHTML}`;
      e.replaceWith(newDom);
    });
    h5Doms.forEach((e) => {
      const newDom = document.createElement('div');
      newDom.innerHTML = `${e.innerHTML}`;
      e.replaceWith(newDom);
    });
    h6Doms.forEach((e) => {
      const newDom = document.createElement('div');
      newDom.innerHTML = `${e.innerHTML}`;
      e.replaceWith(newDom);
    });
    const emailContent = tempDom.innerHTML;

    if (this.stripTags(emailContent).trim()) {
      if (emailContent.indexOf('<table') !== -1) {
        // Table Layout -> IMG_TEXT_HOR, TEXT_IMG_HOR
        const signatureDom = document.createElement('div');
        signatureDom.innerHTML = emailContent;
        const signatureCells = signatureDom.querySelectorAll('td');
        if (signatureCells[0].querySelector('img')) {
          if (signatureCells.length > 1) {
            imageCell = signatureCells[0].innerHTML;
            dataCell = signatureCells[1].innerHTML;
          } else {
            imageCell = signatureCells[0].innerHTML;
          }
        } else {
          if (signatureCells.length > 1) {
            dataCell = signatureCells[0].innerHTML;
            imageCell = signatureCells[1].innerHTML;
          } else {
            dataCell = signatureCells[0].innerHTML;
          }
        }
      } else {
        // Normal Layout -> IMG_TEXT_VER, TEXT_IMG_VER
        const signatureDom = document.createElement('div');
        signatureDom.innerHTML = emailContent;
        const firstImageDom = signatureDom.querySelector('img');
        if (firstImageDom) {
          const firstImageEl = firstImageDom.closest('div');
          const children = signatureDom.children;
          let prevNodeCount = 0;
          let prevHTML = '';
          for (let i = 0; i < children.length; i++) {
            if (children[i] === firstImageEl) {
              break;
            }
            prevHTML += children[i].outerHTML;
            prevNodeCount++;
          }
          if (prevNodeCount < children.length - 1 - prevNodeCount) {
            imageCell = prevHTML + firstImageEl.outerHTML;
            dataCell = emailContent.replace(imageCell, '');
          } else {
            dataCell = prevHTML;
            imageCell = emailContent.replace(dataCell, '');
          }
        } else {
          dataCell = emailContent;
          imageCell = '';
        }
      }
    } else {
      const companyString =
        this.user.source === 'vortex' ? '' : `<div>${this.user.company}</div>`;
      dataCell = `
        <div>${this.user.user_name}</div>
        <div>${this.user.email}</div>
        <div>${this.user.cell_phone}</div>
        ${companyString}
      `;
      imageCell = `
        <div>
          <img src=${this.user.picture_profile} width="100" height="100"/>
        </div>
      `;
    }

    let textCellHTML = '';
    let imageCellHTML = '';
    this.currentTemplate = template.layout;
    let signature;
    switch (this.currentTemplate) {
      case 'img_text_hor':
        signature = `
          <table table_id="table-sign">
            <tr row_id="trow-sign">
              <td table_id="table-sign" row_id="trow-sign" cell_id="tcell-sign">
                ${imageCell}
              </td>
              <td table_id="table-sign" row_id="trow-sign" cell_id="tcell-sign2">
                ${dataCell}
              </td>
            </tr>
          </table>
          <div></div>
        `;
        break;
      case 'text_img_hor':
        signature = `
        <table table_id="table-sign">
            <tr row_id="trow-sign">
              <td table_id="table-sign" row_id="trow-sign" cell_id="tcell-sign">
                ${dataCell}
              </td>
              <td table_id="table-sign" row_id="trow-sign" cell_id="tcell-sign2">
                ${imageCell}
              </td>
            </tr>
          </table>
          <div></div>
        `;
        break;
      case 'text_img_ver':
        textCellHTML = this.clearHTML(dataCell);
        imageCellHTML = this.clearHTML(imageCell);
        textCellHTML = textCellHTML.replace(new RegExp('<p', 'gi'), '<div');
        textCellHTML = textCellHTML.replace(new RegExp('</p>', 'gi'), '</div>');
        imageCellHTML = imageCellHTML.replace(new RegExp('<p', 'gi'), '<div');
        imageCellHTML = imageCellHTML.replace(
          new RegExp('</p>', 'gi'),
          '</div>'
        );
        signature = `
          <div>
            <div class="ql-user-profile">
              ${textCellHTML}
            </div>
            ${imageCellHTML}
          </div>
        `;
        break;
      case 'img_text_ver':
        textCellHTML = this.clearHTML(dataCell);
        imageCellHTML = this.clearHTML(imageCell);
        textCellHTML = textCellHTML.replace(new RegExp('<p', 'gi'), '<div');
        textCellHTML = textCellHTML.replace(new RegExp('</p>', 'gi'), '</div>');
        imageCellHTML = imageCellHTML.replace(new RegExp('<p', 'gi'), '<div');
        imageCellHTML = imageCellHTML.replace(
          new RegExp('</p>', 'gi'),
          '</div>'
        );
        signature = `
          <div>
            ${imageCellHTML}
            <div>
              ${textCellHTML}
            </div>
          </div>
        `;
        break;
    }
    this.emailSignature = signature;
    const delta = this.emailEditor.quillEditor.clipboard.convert(
      this.emailSignature
    );
    this.emailEditor.quillEditor.setContents(delta, 'user');
    return;
  }

  cancel(): void {
    this.emailSignature = this.correctEmailContent(
      this.user.email_signature || ''
    );
    const delta = this.quillEditorRef.clipboard.convert(
      this.user.email_signature
    );
    this.emailEditor.quillEditor.setContents(delta, 'user');
  }

  update(): void {
    this.saving = true;
    const signatureDom = document.createElement('div');
    signatureDom.innerHTML = this.user.email_signature =
      this.emailSignature + '';
    const imageCells = signatureDom.querySelectorAll('img');
    for (let i = 0; i < imageCells.length; i++) {
      if (!imageCells[i].getAttribute('width')) {
        imageCells[i].setAttribute('width', '120');
      }
    }
    const pTags = signatureDom.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    for (let i = 0; i < pTags.length; i++) {
      const tag = <HTMLElement>pTags[i];
      tag.style.margin = '0px';
    }
    const email_signature = signatureDom.outerHTML;
    this.userService
      .updateProfile({ email_signature: email_signature })
      .subscribe((res) => {
        if (res) this.toast.success('signature successfully updated.');
        else this.toast.error('signature update failed.');
        this.saving = false;
      });
  }

  updateEditor(event: any): void {
    this.emailSignature = event.html;
    const tempDom = document.createElement('div');
    tempDom.innerHTML = event.html;
    const h1Doms = tempDom.querySelectorAll('h1');
    const h2Doms = tempDom.querySelectorAll('h2');
    const h3Doms = tempDom.querySelectorAll('h3');
    const h4Doms = tempDom.querySelectorAll('h4');
    const h5Doms = tempDom.querySelectorAll('h5');
    const h6Doms = tempDom.querySelectorAll('h6');
    if (
      h1Doms?.length +
      h2Doms?.length +
      h3Doms?.length +
      h4Doms?.length +
      h5Doms?.length +
      h6Doms?.length
    ) {
      h1Doms.forEach((e) => {
        const newDom = document.createElement('div');
        newDom.innerHTML = `<span style="font-size: 2rem;">${e.innerHTML}</span>`;
        e.replaceWith(newDom);
      });
      h2Doms.forEach((e) => {
        const newDom = document.createElement('div');
        newDom.innerHTML = `<span style="font-size: 2rem;">${e.innerHTML}</span>`;
        e.replaceWith(newDom);
      });
      h3Doms.forEach((e) => {
        const newDom = document.createElement('div');
        newDom.innerHTML = `<span style="font-size: 1.5rem;">${e.innerHTML}</span>`;
        e.replaceWith(newDom);
      });
      h4Doms.forEach((e) => {
        const newDom = document.createElement('div');
        newDom.innerHTML = `${e.innerHTML}`;
        e.replaceWith(newDom);
      });
      h5Doms.forEach((e) => {
        const newDom = document.createElement('div');
        newDom.innerHTML = `${e.innerHTML}`;
        e.replaceWith(newDom);
      });
      h6Doms.forEach((e) => {
        const newDom = document.createElement('div');
        newDom.innerHTML = `${e.innerHTML}`;
        e.replaceWith(newDom);
      });
      this.emailEditor.quillEditor.setContents([]);
      this.emailSignature = tempDom.innerHTML;
      if (
        !this.stripTags(this.emailSignature).trim() &&
        this.emailSignature.includes('<table')
      ) {
        const delta = this.emailEditor.quillEditor.clipboard.convert('');
        this.emailEditor.quillEditor.setContents(delta, '');
        return;
      }
      this.emailEditor.quillEditor.clipboard.dangerouslyPasteHTML(
        0,
        tempDom.innerHTML,
        'user'
      );
    }
  }

  generate() {
    this.generating = true;
    this.user['email_signature'] = initSignatureTemplate(this.user);
    this.userService
      .updateProfile({ email_signature: this.user['email_signature'] })
      .subscribe((res) => {
        if (res) this.toast.success('signature successfully generated.');
        else this.toast.error('signature generate failed.');
        this.saving = false;
        this.generating = false;
      });
  }

  getEditorInstance(editorInstance: any): void {
    this.quillEditorRef = editorInstance;
    const toolbar = this.quillEditorRef.getModule('toolbar');
    toolbar.addHandler('image', this.initImageHandler);
    this.table = this.quillEditorRef.getModule('better-table');

    if (this.emailSignature) {
      const delta = this.quillEditorRef.clipboard.convert(this.emailSignature);
      this.emailEditor.quillEditor.setContents(delta, 'user');
    }

    this.emailEditor.quillEditor.container.addEventListener('click', (ev) => {
      const img = Parchment.Registry?.find(ev.target);
      if (img instanceof ImageBlot) {
        this.emailEditor.quillEditor.setSelection(
          img.offset(this.emailEditor.quillEditor.scroll),
          1,
          'user'
        );
      }
    });

    const tooltip = this.emailEditor.quillEditor.theme.tooltip;
    const input = tooltip.root.querySelector('input[data-link]');
    input.dataset.link = 'www.crmgrow.com';
  }

  initImageHandler = (): void => {
    this.emailEditor.quillEditor.focus();
    const range = this.quillEditorRef.getSelection(true);
    this.zone.run(() => {
      const assetDlg = this.dialog.open(AssetsManagerComponent, {
        width: '100vw',
        maxWidth: '720px',
        height: 'calc(100vh - 80px)'
      });
      assetDlg['_ref']['overlayRef']['_host'].classList.add('assets-manager');
      assetDlg.afterClosed().subscribe((res) => {
        res?.data?.forEach((e) => {
          this.insertImageToEditor(e.url, range);
        });
      });
    });
  };

  insertImageToEditor(url: string, range): void {
    if (range?.index) {
      this.emailEditor.quillEditor.focus();
      this.quillEditorRef.setSelection(range, 'user');
    } else {
      this.emailEditor.quillEditor.focus();
    }
    const _r = this.quillEditorRef.getSelection(true);
    this.emailEditor.quillEditor.insertEmbed(_r.index, `image`, url, 'user');
    this.emailEditor.quillEditor.formatText(_r.index, 1, 'width', '300px');
    this.emailEditor.quillEditor.setSelection(_r.index + 1, 0, 'user');
    const length = this.emailEditor.quillEditor.getLength();
    this.emailEditor.quillEditor.insertText(length, '\n', {}, 'user');
    this.emailEditor.quillEditor.setSelection(length + 1, 0, 'user');
  }

  clearHTML(html: string): string {
    const outerDom = document.createElement('div');
    outerDom.innerHTML = html;
    const pels = outerDom.querySelectorAll('p');
    for (let i = 0; i < pels.length; i++) {
      const attrs = pels[i].attributes;
      for (let j = 0; j < attrs.length; j++) {
        pels[i].removeAttribute(attrs[j].name);
      }
    }
    return outerDom.innerHTML;
  }

  private correctEmailContent(text: string): string {
    if (this.stripTags(text).trim()) {
      const wrapper = this.document.createElement('div');
      wrapper.innerHTML = text;
      if (wrapper.querySelector('table')) {
        const contents = wrapper.querySelectorAll('td');
        const cellContent1 = contents[0]?.innerHTML || '<div></div>';
        const cellContent2 = contents[1]?.innerHTML || '<div></div>';
        if (contents[0]?.querySelector('img')) {
          this.currentTemplate = 'img_text_hor';
        } else if (contents[1]?.querySelector('img')) {
          this.currentTemplate = 'text_img_hor';
        } else {
          this.currentTemplate = '';
        }
        const emailSignature = `
          <table table_id="table-sign">
          <tr row_id="trow-sign">
            <td table_id="table-sign" row_id="trow-sign" cell_id="tcell-sign">
              ${cellContent1}
            </td>
            <td table_id="table-sign" row_id="trow-sign" cell_id="tcell-sign2">
              ${cellContent2}
            </td>
          </tr>
        </table>
        <div></div>
        `;
        return emailSignature;
      } else {
        const sub_wrapper = wrapper.querySelector('div');
        const contents = sub_wrapper.querySelectorAll('div');
        let text_position = null;
        let img_position = null;
        for (let i = 0; i < contents.length; i++) {
          if (contents[i].querySelector('img')) {
            img_position = i;
          } else if (contents[i].innerText) {
            text_position = i;
          }
        }
        if (
          text_position !== null &&
          img_position !== null &&
          text_position < img_position
        ) {
          this.currentTemplate = 'text_img_ver';
        } else if (
          text_position !== null &&
          img_position !== null &&
          text_position > img_position
        ) {
          this.currentTemplate = 'img_text_ver';
        } else {
          this.currentTemplate = '';
        }
        const emailSignature = ``;
        return wrapper.outerHTML;
      }
    } else {
      this.currentTemplate = '';
      return '';
    }
  }

  private stripTags(text: string): string {
    return text ? text.replace(/<(?:.|\s)*?>/g, '') : '';
  }

  test(): void {
    addTable(this.quillEditorRef, 'newtable_1_2');
  }
}
