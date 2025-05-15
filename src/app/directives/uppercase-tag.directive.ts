import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
  DoCheck
} from '@angular/core';

@Directive({
  selector: '[appUppercaseTag]'
})
export class UppercaseTagDirective implements DoCheck {
  private previousInnerText: string | null = null;
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngDoCheck(): void {
    const currentInnerText = this.el.nativeElement.innerText;
    if (currentInnerText !== this.previousInnerText) {
      this.checkAndApplyUppercase(currentInnerText);
      this.previousInnerText = currentInnerText;
    }
  }

  private checkAndApplyUppercase(currentInnerText: string): void {
    const isRedX = currentInnerText.toLowerCase() === 'redx';
    const targetClass = isRedX ? 'text-uppercase' : 'text-capitalize';
    const otherClass = isRedX ? 'text-capitalize' : 'text-uppercase';

    if (
      !this.el.nativeElement.classList.contains(targetClass) ||
      this.el.nativeElement.classList.contains(otherClass)
    ) {
      this.renderer.removeClass(this.el.nativeElement, otherClass);
      this.renderer.addClass(this.el.nativeElement, targetClass);
    }
  }
}
