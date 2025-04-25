export function Step(context, t) {
  this._context = context;
  this._t = t;
}

Step.prototype = {
  areaStart() {
    this._line = 0;
  },
  areaEnd() {
    this._line = NaN;
  },
  lineStart() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd() {},
  point(x, y) {
    x = +x;
    y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2; // proceed
      default: {
        const y0 =
          this._y > y ? this._y * 0.67 + y * 0.33 : this._y * 0.33 + y * 0.67;
        const y1 =
          this._y > y ? this._y * 0.33 + y * 0.67 : this._y * 0.67 + y * 0.33;
        this._context.bezierCurveTo(this._x, y0, x, y1, x, y);
        break;
      }
    }
    // tslint:disable-next-line: ban-comma-operator
    (this._x = x), (this._y = y);
  }
};

export const stepRound = function (context) {
  return new Step(context, 0.5);
};
