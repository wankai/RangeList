/**
 * @author wankaizhang@gmail.com
 * @classdesc This is a class for manipulating a list of integer ranges.
 */

class RangeList {
  /**
   * Create a new empty RangeList.
   *  
   * Usage:
   *     rl = new RangeList();
   *     rl.add([5, 9]);
   *     rl.add([20, 78]);
   *
   * Don't pass arguments to the constructor, unless you are writing unit tests.
   *
   * @constructor
   * @param {...Array<number>} ranges passed to constructor when doing unit tests.
   * @public
   */
  constructor(...ranges) {
    this.ranges_ = [];

    /**
     * ranges is not validated here. Please make sure
     * ranges is valid when writing unit tests.
     */
    for (let rg of ranges) {
      this.ranges_.push(rg);
    }
  }

  /**
   * Get the length of the range list.
   * @return {number} It returns length of range list
   * @public
   */
  length() {
    return this.ranges_.length;
  }

  /**
   * Add a new range in the appropriate position in range list.
   * If it is overlapped with existing ranges in range list, delete
   * all the overlapped ranges, and then insert the
   * newly constructed range.
   *
   * For example: if [10, 16) is added to [4, 7) [9, 11) [15, 21)
   * , the result will be [4, 7) [9, 21)
   *
   * As shown above, two existing ranges are deleted, and a newly
   * constructed range [9, 21) is inserted after [4, 7)
   *
   * @param {Array<number>} range - Array of two integers that specify
   *        begining and end of range.
   * @return {void}
   * @public
   */
  add(range) {
    this.checkRange_(range);
    if (this.isEmptyRange_(range)) {
      return;
    }
    const [begin, end] = range;
    const begin_index = this.find_(begin);
    const end_index = this.find_(end);

    /**
     * [new_begin, new_end) is the newly constructed range when overlapping occurs, or
     * it will be the same as [begin, end)
     *
     * del_begin_index and del_end_index specify the ranges which is
     * overlapped with [begin, end), and will be deleted.
     */
    let new_begin = begin;
    let new_end = end;
    let del_begin_index = begin_index;
    let del_end_index = end_index;

    // Compute the new_begin and del_begin_index
    if (begin_index % 2 === 0) {
      const pre_index = begin_index - 1;
      if (pre_index > 0 && this.getValue_(pre_index) === begin) {
        del_begin_index = pre_index;
        new_begin = this.getValue_(pre_index-1);
      }
    } else {
      new_begin = this.getValue_(begin_index - 1);
    }

    // Compute the new_end and del_end_index
    if (end_index % 2 === 0) {
      del_end_index = end_index - 1;
    } else {
      new_end = this.getValue_(end_index);
    }
    
    /** Convert index in flattened range list to that in the original range list */
    del_begin_index = Math.floor(del_begin_index / 2);
    del_end_index = Math.floor(del_end_index / 2);

    let how_many = del_end_index - del_begin_index + 1;
    
    this.ranges_.splice(del_begin_index, how_many, [new_begin, new_end]);
  }

  /**
   * Remove a range from range list. It may cause some overlapped ranges to be split.
   *
   * For example: remove [6, 19) from [3, 8) [10, 14) [17, 32) leads to [3, 6) [19, 32)
   *
   * The first and last range are both split. It effectively delete all the ranges in
   * the original range list before inserting two newly constructed ranges.
   *
   * @param {Array<number>} range - Array of two integers that specify begining and end
   *        of the range to be removed.
   * @return {void}
   * @public
   */
  remove(range) {
    this.checkRange_(range);
    if (this.isEmptyRange_(range)) {
      return;
    }

    const [begin, end] = range;
    const begin_index = this.find_(begin);
    const end_index = this.find_(end);

    /**
     * del_begin_index and del_end_index specify the ranges to be deleted.
     * cutted collects the newly constructed ranges when splitting.
     */
    let del_begin_index = begin_index;
    let del_end_index = end_index;
    let cutted = [];

    /**
     * compute del_begin_index (while not changed), and
     * collect newly constructed ranges caused by a of [a, b)
     */
    if (begin_index % 2 === 1) {
      const left_value = this.getValue_(begin_index - 1);
      if (begin > left_value) {
        cutted.push([left_value, begin]);
      }
    }

    /**
     * compute del_end_index, and
     * collect newly constructed ranges caused by b of [a, b)
     */
    if (end_index % 2 === 1) {
      const right_value = this.getValue_(end_index);
      const left_value = this.getValue_(end_index - 1);
      if (end > left_value) {
        cutted.push([end, right_value]);
      } else {
        del_end_index = del_end_index - 2; // del_end_index - 1 will not make a change
      }
    } else {
      del_end_index = del_end_index - 1;
    }

    /** Convert index in flattened range list to that in the original range list */
    del_begin_index = Math.floor(del_begin_index / 2);
    del_end_index = Math.floor(del_end_index / 2);

    let how_many = del_end_index - del_begin_index + 1;

    this.ranges_.splice(del_begin_index, how_many, ...cutted);
  }

  /**
   * String representation of range list.
   * @return {string} returns string representation of range list.
   * @public
   */
  toString() {
    return this.ranges_.map(item => `[${item[0]}, ${item[1]})`).join(" ");
  }

  /**
   * Print the string representation of range list
   * @return {void}
   * @public
   */
  print() {
    console.log(this.toString());
  }

  /**
   * Check empty range
   *    [n, n) is a empty range.
   *
   * @param {Array<number>} range - range to be checked.
   * @return {boolean} It returns true if range is empty, otherwise false.
   * @private
   */
  isEmptyRange_(range) {
    return range[0] === range[1];
  }

  /**
   * Check if range is valid.
   * @param {Array<number>} range - range to be checked.
   * @return {void} Throw exception if range is invalid.
   * @private
   */
  checkRange_(range) {
    if (!Array.isArray(range)) {
      throw new RangeList.InvalidArgumentError("param range must be an array");
    }
    if (range.length != 2) {
      throw new RangeList.InvalidArgumentError("param range lengh must equal to 2 ");
    }
    if (!Number.isInteger(range[0])) {
      throw new RangeList.InvalidArgumentError("first number of range must be integer ");
    }
    if (!Number.isInteger(range[1])) {
      throw new RangeList.InvalidArgumentError("second number of range must be integer ");
    }
  }

  /**
   * Get the value indexed by index in the flattened range list.
   *
   *     range list [[3, 6], [9, 13], [16, 20]] is flattend to be
   *         [3, 6, 9, 13, 16, 20]
   *
   *     getValue_(1) returns 6
   *     getValue_(3) returns 13
   *     
   * @param {number} index - the index to query
   * @return {number} value in the flattened range list.
   * @throw {RangeError} Practically, it will never throw exceptions, because
   *        this method is only used privately by find_().
   * @private
   */
  getValue_(index) {
    const divide2 = Math.floor(index/2);
    if (index % 2 === 0) {
      return this.ranges_[divide2][0];
    } else {
      return this.ranges_[divide2][1];
    }
  }

  /**
   * Find the first array index, in flattened range list, whose number
   * is greater than value.
   *
   *     range list [[3, 6], [9, 13], [16, 20]] is flattend to be
   *         [3, 6, 9, 13, 16, 20]
   *
   *     find_(1) returns 0
   *     find_(3) returns 1
   *     find_(6) returns 2
   *     find_(12) returns 3
   *     find_(23) returns 6
   *
   * @param {number} value - the integer value to be found
   * @return {number} the index of the first number which is
   *          greater than value. it returns this.length() if 
   *          there is no number greater than value.
   * @private
   */
  find_(value) {
    const n = this.length();
    
    let left = 0;
    let right = n * 2 - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const mid_value = this.getValue_(mid);

      if (mid_value <= value) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return left;
  }
}

/**
 * InvalidArgumentError is throwed when range format is invalid.
 * It's effectively a nested class of class RangeList.
 *
 * The code is arranged here, but not inside class RangeList, because
 * jsDoc can't process nested class
 *
 *     Usage:
 *         throw new RangeList.InvalidArgumentError("error message");
 *
 * @classdesc InvalidArgumentError is effectively a nested exception class
 *            within the namespace RangeList.
 */
RangeList.InvalidArgumentError = class extends Error {
  /**
   * @constructor
   * @param {string} message - error message when throwed
   * @return {void}
   * @public
   */
  constructor(message) {
    super(message);
    this.name = "InvalidArgumentError";
  } 
}

module.exports = RangeList;
