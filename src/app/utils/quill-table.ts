import * as Quill from 'quill';
const Container = Quill.import('blots/container');
const Block = Quill.import('blots/block');
const BlockEmbed = Quill.import('blots/block/embed');
const Parchment = Quill.import('parchment');
const Delta = Quill.import('delta');
const Scroll = Quill.import('blots/scroll');

class ContainBlot extends Container {
  domNode: any;
  static blotName: string;
  static tagName: string;
  static scope: any;
  static defaultChild: string;
  static allowedChildren: any[];
  parent: any;

  optimize(context: any) {
    super.optimize(context);
  }
  insertBefore(childBlot: any, refBlot: any) {
    super.insertBefore(childBlot, refBlot);
  }
  replace(target: any) {
    super.replace(target);
  }
  static create(value) {
      return super.create(value);
  }

  formats(domNode) {
      if(domNode){
          return domNode.tagName;
      }
      return this.domNode.tagName;
  }

  appendChild(item) {
    this.insertBefore(item, null);
  }

  remove() {
    if (this.domNode.parentNode != null) {
      this.domNode.parentNode.removeChild(this.domNode);
    }
    this.detach();
  }

  detach() {
    if (this.parent != null)
        this.parent.removeChild(this);
    delete this.domNode[Parchment.Registry?.DATA_KEY];
};
}
ContainBlot.blotName = 'contain';
ContainBlot.tagName = 'contain';
ContainBlot.scope = Parchment.Scope.BLOCK_BLOT;
ContainBlot.defaultChild = 'block';
ContainBlot.allowedChildren = [Block, BlockEmbed, Container];


class TableCell extends ContainBlot {
  statics: any;
  parent: any;
  children: any;
  next: any;

  static create(value) {
      let tagName = 'td';
      let node = super.create(tagName);
      let ids = value.split('|');
      node.setAttribute('table_id', ids[0]);
      node.setAttribute('row_id', ids[1]);
      node.setAttribute('cell_id', ids[2]);
      return node;
  }

  format() {
      this.domNode.getAttribute('id');
  }

  formats() {
      // We don't inherit from FormatBlot
      return {
          [this.statics.blotName]:
          this.domNode.getAttribute('table_id') + '|' +
          this.domNode.getAttribute('row_id') + '|' +
          this.domNode.getAttribute('cell_id')
      }
  }

  optimize(context) {
      super.optimize(context);

      let parent = this.parent;
      if (parent != null) {
          if (parent.statics.blotName === 'td') {
              this.moveChildren(parent, this);
              this.remove();
              return;
          } else if (parent.statics.blotName != 'tr') {
              // we will mark td position, put in table and replace mark
              let mark = Parchment.create('block');
              this.parent.insertBefore(mark, this.next);
              let table = Parchment.create('table', this.domNode.getAttribute('table_id'));
              let tr = Parchment.create('tr', this.domNode.getAttribute('row_id'));
              table.appendChild(tr);
              tr.appendChild(this);
              table.replace(mark);
          }
      }

      // merge same TD id
      let next = this.next;
      if (next != null && next.prev === this &&
          next.statics.blotName === this.statics.blotName &&
          next.domNode.tagName === this.domNode.tagName &&
          next.domNode.getAttribute('cell_id') === this.domNode.getAttribute('cell_id')) {
          next.moveChildren(this);
          next.remove();
      }
  }
  

  insertBefore(childBlot, refBlot) {
      if (this.statics.allowedChildren != null && !this.statics.allowedChildren.some(function (child) {
              return childBlot instanceof child;
          })) {
          let newChild = Parchment.create(this.statics.defaultChild);
          newChild.appendChild(childBlot);
          childBlot = newChild;
      }
      super.insertBefore(childBlot, refBlot)
  }

  replace(target) {
      if (target.statics.blotName !== this.statics.blotName) {
          let item = Parchment.create(this.statics.defaultChild);
          target.moveChildren(item);
          this.appendChild(item);
      }
      if (target.parent == null) return;
      super.replace(target)
  }

  moveChildren(targetParent, refNode) {
      this.children.forEach(function (child) {
          targetParent.insertBefore(child, refNode);
      });
  }
}

TableCell.blotName = 'td';
TableCell.tagName = 'td';
TableCell.scope = Parchment.Scope.BLOCK_BLOT;
TableCell.defaultChild = 'block';
TableCell.allowedChildren = [Block, BlockEmbed, Container];

class TableRow extends ContainBlot {
  children: any;
  statics: any;
  next: any;
  parent: any;
  static create(value) {
      let tagName = 'tr';
      let node = super.create(tagName);
      node.setAttribute('row_id', value ? value : random_id());
      return node;
  }

  format() {
      this.domNode.getAttribute('row_id');
  }

  optimize(context) {
      if (this.children.length === 0) {
          if (this.statics.defaultChild != null) {
              var child = this.createDefaultChild();
              this.appendChild(child);
              child.optimize(context);
          }
          else {
              this.remove();
          }
      }
      let next = this.next;
      if (next != null && next.prev === this &&
          next.statics.blotName === this.statics.blotName &&
          next.domNode.tagName === this.domNode.tagName &&
          next.domNode.getAttribute('row_id') === this.domNode.getAttribute('row_id')) {
          next.moveChildren(this);
          next.remove();
      }
  }

  insertBefore(childBlot, refBlot) {
      if (this.statics.allowedChildren != null && !this.statics.allowedChildren.some(function (child) {
              return childBlot instanceof child;
          })) {
          let newChild = this.createDefaultChild(refBlot);
          newChild.appendChild(childBlot);
          childBlot = newChild;
      }
      super.insertBefore(childBlot, refBlot);
  }

  replace(target) {
      if (target.statics.blotName !== this.statics.blotName) {
          let item = this.createDefaultChild();
          target.moveChildren(item, this);
          this.appendChild(item);
      }
      super.replace(target);
  }

  createDefaultChild(refBlot = null) {
      let table_id = null;
      if (refBlot) {
          table_id = refBlot.domNode.getAttribute('table_id');
      } else if (this.parent) {
          table_id = this.parent.domNode.getAttribute('table_id');
      } else {
          table_id = this.domNode.parent.getAttribute('table_id');
      }

      return Parchment.create(this.statics.defaultChild, [table_id, this.domNode.getAttribute('row_id'), random_id()].join('|'));
  }

}

TableRow.blotName = 'tr';
TableRow.tagName = 'tr';
TableRow.scope = Parchment.Scope.BLOCK_BLOT;
TableRow.defaultChild = 'td';
TableRow.allowedChildren = [TableCell];

class Table extends ContainBlot {
  next: any;
  statics: any;
  static create(value) {
      let tagName = 'table';
      let node = super.create(tagName);
      node.setAttribute('table_id', value);

      return node;
  }

  format() {
      this.domNode.getAttribute('table_id');
  }

  optimize(context) {
      super.optimize(context);
      let next = this.next;
      if (next != null && next.prev === this &&
          next.statics.blotName === this.statics.blotName &&
          next.domNode.tagName === this.domNode.tagName &&
          next.domNode.getAttribute('table_id') === this.domNode.getAttribute('table_id')) {
          next.moveChildren(this);
          next.remove();
      }
  }

  insertBefore(childBlot, refBlot) {
      if (this.statics.allowedChildren != null && !this.statics.allowedChildren.some(function (child) {
              return childBlot instanceof child;
          })) {
          let newChild = Parchment.create(this.statics.defaultChild, random_id());
          newChild.appendChild(childBlot);
          childBlot = newChild;
      }
      super.insertBefore(childBlot, refBlot)
  }

}

Table.blotName = 'table';
Table.tagName = 'table';
Table.scope = Parchment.Scope.BLOCK_BLOT;
Table.defaultChild = 'tr';
Table.allowedChildren = [TableRow];


class TableModule {
  constructor(quill, options) {
      let clipboard = quill.getModule('clipboard');
      clipboard.addMatcher('TABLE', function (node, delta) {
          return delta;
      });
      clipboard.addMatcher('TR', function (node, delta) {
          return delta;
      });
      clipboard.addMatcher('TD', function (node, delta) {
          return delta.compose(new Delta().retain(delta.length(), {
              td: node.getAttribute('table_id') + '|' + node.getAttribute('row_id') + '|' + node.getAttribute('cell_id')
          }));
      });
  }
}

Quill.register(TableCell);
Quill.register(TableRow);
Quill.register(Table);
Quill.register(ContainBlot);
Quill.register('modules/table', TableModule);

function random_id() {
  return Math.random().toString(36).slice(2)
}

export function addTable(quill, value) {
  let node = null;
  let sizes = value.split('_');
  let row_count = Number.parseInt(sizes[1]);
  let col_count = Number.parseInt(sizes[2]);
  let table_id = random_id();
  let table = Parchment.create('table', table_id);
  for (var ri = 0; ri < row_count; ri++) {
      let row_id = random_id();
      let tr = Parchment.create('tr', row_id);
      table.appendChild(tr);
      for (var ci = 0; ci < col_count; ci++) {
          let cell_id = random_id();
          value = table_id + '|' + row_id + '|' + cell_id;
          let td = Parchment.create('td', value);
          tr.appendChild(td);
          let p = Parchment.create('block');
          td.appendChild(p);
          let br = Parchment.create('break');
          p.appendChild(br);
          node = p;
      }
  }
  let leaf = quill.scroll.leaf(quill.getSelection()?.['index'] || 0);
  let blot = leaf[0];
  let top_branch = null;
  for (; blot != null && !(blot instanceof Container || blot instanceof Scroll);) {
      top_branch = blot;
      blot = blot.parent;
  }
  blot.insertBefore(table, top_branch);
  return node;
}
