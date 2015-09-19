import Image from './image';
import {env, loadBinary, DOMImage, ImageData, Canvas, isDifferentOrigin} from './environment';
import PNGReader from 'png.js';
import {TIFFDecoder} from 'tiff';

const isPNG = /\.png$/i;
const isTIFF = /\.tiff?$/i;

function swap16(val) {
    return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
}

export function loadURL(url) {
    if (url.match(isPNG)) {
        return loadPNG(url);
    } else if (url.match(isTIFF)) {
        return loadTIFF(url);
    } else {
        return loadGeneric(url);
    }
}

function loadPNG(url) {
    return loadBinary(url).then(function (data) {
        return new Promise(function (resolve, reject) {
            const reader = new PNGReader(data);
            reader.parse(function (err, png) {
                if (err) return reject(err);
                const bitDepth = png.getBitDepth();
                const buffer = png.pixels.buffer;
                const offset = png.pixels.byteOffset;
                const length = png.pixels.length;
                let data;
                if (bitDepth === 8) {
                    data = new Uint8ClampedArray(buffer, offset, length);
                } else if (bitDepth === 16) {
                    data = new Uint16Array(buffer, offset, length / 2);
                    for (let i = 0; i < data.length; i++) {
                        data[i] = swap16(data[i]);
                    }
                }

                resolve(new Image(png.width, png.height, data, {
                    components: png.colors - png.alpha,
                    alpha: png.alpha,
                    bitDepth: bitDepth
                }));
            });
        });
    });
}

function loadTIFF(url) {
    return loadBinary(url).then(function (data) {
        let decoder = new TIFFDecoder(data);
        let result = decoder.decode();
        let image = result.ifd[0];
        return new Image(image.width, image.height, image.data, {
            components: 1,
            alpha: 0,
            colorModel: null,
            bitDepth: image.bitsPerSample
        });
    });
}

function loadGeneric(url) {
    return new Promise(function (resolve, reject) {
        let image = new DOMImage();

        if (isDifferentOrigin(url)) {
            // see https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
            image.crossOrigin = 'Anonymous';
        }

        image.onload = function () {
            let w = image.width, h = image.height;
            let canvas = new Canvas(w, h);
            let ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, w, h);
            let data = ctx.getImageData(0, 0, w, h).data;
            resolve(new Image(w, h, data));
        };
        image.onerror = reject;
        image.src = url;
    });
}