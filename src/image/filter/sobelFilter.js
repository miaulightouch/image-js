import gradientFilter from './gradientFilter';
import { GRADIENT_X, GRADIENT_Y } from '../../util/kernels';

/**
 * @memberof Image
 * @instance
 * @param {object} [options]
 * @param {string} [options.border='copy']
 * @param {*} [options.channels]
 * @param {number} [options.bitDepth=this.bitDepth] Specify the bitDepth of the resulting image
 * @return {Image}
 */
export default function sobelFilter(options) {
  return gradientFilter.call(this, Object.assign({}, options, {
    kernelX: GRADIENT_X,
    kernelY: GRADIENT_Y
  }));
}
