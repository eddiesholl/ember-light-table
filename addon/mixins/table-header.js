import Ember from 'ember';
import callAction from 'ember-light-table/utils/call-action';
/* globals $ */
const {
  computed
} = Ember;

/**
 * @module Mixins
 */

/**
 * @class TableHeaderMixin
 * @extends Ember.Mixin
 * @private
 */

export default Ember.Mixin.create({
  /**
   * @property table
   * @type {Table}
   * @private
   */
  table: null,

  /**
   * @property fixed
   * @type {Boolean}
   * @default false
   */
  fixed: false,

  /**
   * @property sortOnClick
   * @type {Boolean}
   * @default true
   */
  sortOnClick: true,

  /**
   * @property multiColumnSort
   * @type {Boolean}
   * @default false
   */
  multiColumnSort: false,

  /**
   * @property iconAscending
   * @type {String}
   * @default ''
   */
  iconAscending: '',

  /**
   * @property iconDescending
   * @type {String}
   * @default ''
   */
  iconDescending: '',

  /**
   * ID of main table component. Used to generate divs for ember-wormhole
   * @type {String}
   */
  tableId: null,

  renderInPlace: computed.oneWay('fixed'),
  columnGroups: computed.oneWay('table.visibleColumnGroups'),
  subColumns: computed.oneWay('table.visibleSubColumns'),
  columns: computed.oneWay('table.visibleColumns'),

  sortIcons: computed('iconAscending', 'iconDescending', function() {
    return this.getProperties(['iconAscending', 'iconDescending']);
  }),

  actions: {
    /**
     * onColumnClick action. Handles column sorting.
     *
     * @event onColumnClick
     * @param  {Column}   column The column that was clicked
     * @param  {Event}   event   The click event
     */
    onColumnClick(column) {
      if (column.sortable && this.get('sortOnClick')) {
        if (column.sorted) {
          column.toggleProperty('ascending');
        } else {
          if (!this.get('multiColumnSort')) {
            this.get('table.sortedColumns').setEach('sorted', false);
          }
          column.set('sorted', true);
        }
      }
      callAction(this, 'onColumnClick', ...arguments);
    },

    /**
     * onColumnDoubleClick action.
     *
     * @event onColumnDoubleClick
     * @param  {Column}   column The column that was clicked
     * @param  {Event}   event   The click event
     */
    onColumnDoubleClick( /* column */ ) {
      callAction(this, 'onColumnDoubleClick', ...arguments);
    },

    onMouseDown(column, event) {
      this.set('mouseDown', true);
      console.log('onMouseDown aaa ' + event.pageX);
      const elem = $(this)[0].element;
      const cellLocation = event.currentTarget.getBoundingClientRect();
      console.log('cellLocation left ' + cellLocation.left);
      const dragStartOffset = event.pageX - cellLocation.left;
      this.set('dragStartOffset', dragStartOffset);
      this.set('headerLeft', elem.offsetLeft);
      this.set('headerRight', elem.offsetWidth - elem.offsetLeft);
      console.log(`mouse start ${cellLocation.left} => ${dragStartOffset}`);

    },

    onMouseMove(column, event) {

      if (!column.get('draggable')) {
        return;
      }

      if (this.get('mouseDown')) {
        const dragStarted = this.get('dragStarted');
        var dragSubject;

        if (dragStarted) {
          dragSubject = this.get('dragSubject');
        } else {
          this.set('dragStarted', true);
          const dragOriginal = $(event.currentTarget);
          const clientRect = event.currentTarget.getBoundingClientRect();
          const clone = dragOriginal.clone(false);
          clone.css({ width: clientRect.width });

          const tableBody = $(`#${this.get('tableId')} .lt-body`);

          const shadedBelow = $('<div/>')
            .css({
              width: clientRect.width,
              height: tableBody.height(),
              backgroundColor: 'lightgrey'
            });

          dragSubject = $('<div/>')
            .append(clone)
            .append(shadedBelow)
            .css({
              position: 'absolute',
              left: clientRect.left,
              width: clientRect.width,
              opacity: 0.9,
              userSelect: 'none',
              boxShadow: '5px 5px 5px #888888'
            });
          dragSubject.insertAfter('.lt-head-wrap');
          this.set('dragSubject', dragSubject);
        }

        const headerLeft = this.get('headerLeft');
        const headerRight = this.get('headerRight');
        const dragWidth = dragSubject.width();
        const dragStartOffset = this.get('dragStartOffset');
        var leftAfterMove = event.pageX - dragStartOffset;
        const rightAfterMove = leftAfterMove + dragWidth;
        if (leftAfterMove < headerLeft) {
          leftAfterMove = headerLeft;
        } else if (rightAfterMove > headerRight) {
          leftAfterMove = headerRight - dragWidth;
        }
        dragSubject.css('left', leftAfterMove);
        //const dragDelta = dragStart - event.pageX;
        console.log(`dragging ${dragStartOffset} ${event.pageX}`);
      }
    },

    onMouseUp(column, event) {
      const dragSubject = this.get('dragSubject');
      if (dragSubject) {
        const dragStartOffset = this.get('dragStartOffset');
        const midline = event.pageX - dragStartOffset + (dragSubject.width() / 2);
        const headTop = dragSubject.position().top;
        dragSubject.remove();
        const nearestElement = document.elementFromPoint(midline, headTop);
        const dropTargetLabel = nearestElement.getAttribute('data-label');
        this.dragColumn(column, dropTargetLabel);
      }
      this.set('mouseDown', false);
      this.set('dragStarted', false);
      this.set('dragSubject', null);
      this.set('dragStartOffset', null);
    },

    /*    onMouseEnter(column) {
          console.log('onMouseEnter ' + column.get('label'));
        },
        onDragEnd(column) {
          console.log('onDragEnd ' + column.get('label'));
        },
        onDrop(column) {
          console.log('onDrop ' + column.get('label'));
        },*/

  },

  dragColumn: function(draggedColumn, targetColumnName) {
    this.get('table').dragColumn(draggedColumn, targetColumnName);
  }
});
