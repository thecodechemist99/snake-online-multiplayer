/*
 * General utilities class.
 * Distributed under the MIT License.
 * (c) 2020 Florian Beck
 */

export default class Utils {
  static median(numbers) {
    // source: https://www.sitepoint.com/community/t/calculating-the-average-mean/7302/2
    let median = 0;
    let numsLen = numbers.length;
  
    numbers.sort();
    if (numsLen % 2 === 0) {
      // average of two middle numbers
      median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else {
      // middle number only
      median = numbers[(numsLen - 1) / 2];
    }
    return median;
  }
}