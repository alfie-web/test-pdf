import React from 'react'
// import { documentToSVG, elementToSVG, inlineResources, formatXML } from 'dom-to-svg'
// import htmlToSvg from "htmlsvg"
// import domtoimage from 'dom-to-image'
// import domtoimagemore from 'dom-to-image-more'
import { jsPDF } from 'jspdf'
// import PDFDocument from 'pdfkit'
// import { toSvg, toCanvas } from 'html-to-image';
// import html2canvas from 'html2canvas';
import 'svg2pdf.js'
// import C2S from 'canvas2svg'
import { Context } from "svgcanvas";

// import TextToSVG from 'text-to-svg';

// import cmap from 'font-cmap'
// import opentype from 'opentype.js';
// import fontChars from 'font-chars';
// import svgToPath from 'path-that-svg';
// import svgpath from 'svgpath';

import './App.css'

const wrapText = function(ctx, text, x, y, maxWidth, lineHeight, textAlign = 'left') {
	const originalX = x;

	// First, start by splitting all of our text into words, but splitting it into an array split by spaces
	let words = text.split(' ');
	let line = ''; // This will store the text of the current line
	let testLine = ''; // This will store the text when we add a word, to test if it's too long
	let lineArray = []; // This is an array of lines, which the function will return

	// Lets iterate over each word
	for(var n = 0; n < words.length; n++) {
		 // Create a test line, and measure it..
		 testLine += `${words[n]} `;
		 let metrics = ctx.measureText(testLine);
		 let testWidth = metrics.width;

		 // If the width of this test line is more than the max width
		 if (testWidth > maxWidth && n > 0) {
			  // Then the line is finished, push the current line into "lineArray"
			  lineArray.push([line, x, y, testWidth]);
			  // Increase the line height, so a new line is started
			  y += lineHeight;
			  // Update line and test line to use this word as the first word on the next line
			  line = `${words[n]} `;
			  testLine = `${words[n]} `;
		 }
		 else {
			  // If the test line is still less than the max width, then add the word to the current line
			  line += `${words[n]} `;
		 }

		 if (textAlign === 'right') {
			 x = originalX + (maxWidth - testWidth)
		} else if (textAlign === 'center') {
			x = originalX + ((maxWidth / 2) - (testWidth / 2))
		}

		// If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
		 if(n === words.length - 1) {
			lineArray.push([line, x, y, testWidth]);
		 }
	}
	// Return the line array
	return lineArray;
}

function _getBorderPath(dir, x, y, r, size, firstArcWidth, firstArcHeight, secondArcWidth, secondArcHeight) {
	const elipseAxis = `${r},${r}`;

	return `M${x},${y}` +
	 `a${elipseAxis} 0 0 1 ${firstArcWidth},${firstArcHeight}` +
	 dir + size +
	 `a${elipseAxis} 0 0 1 ${secondArcWidth},${secondArcHeight}`;
 }

const loadImage = async (url) => new Promise((resolve) => {
	const image = new Image()
	image.onload = () => {
		resolve(image)
	}
	image.src = url
	image.crossOrigin='*'
});

const loadFont = async (url) => new Promise(async (resolve) => {
	const fontResponse = await fetch(url);
	const fontResponseBlob = await fontResponse.blob();

	var reader = new FileReader();

	reader.readAsDataURL(fontResponseBlob);

	reader.onloadend = async () => {
		const base64data = reader.result;
		const binaryString = base64data.substr(base64data.indexOf('base64,') + 7);

		resolve({ font: binaryString });
	}
});

function calcSvgObjectSize(width, height, maxSize) {
	const result = { width, height };

	if (width > height) {
	  const diffPercent = ((width - height) / width) * 100;

	  result.width = maxSize;
	  result.height = Math.ceil(maxSize - ((maxSize * diffPercent) / 100));
	} else if (width < height) {
	  const diffPercent = ((height - width) / height) * 100;

	  result.width = Math.ceil(maxSize - ((maxSize * diffPercent) / 100));
	  result.height = maxSize;
	} else {
	  result.width = maxSize;
	  result.height = maxSize;
	}

	return result;
 }

function createCanvasImage(url, width, height) {
	const cropCanvas = document.createElement('canvas');
	const cropCtx = cropCanvas.getContext('2d');

	cropCanvas.width = width
	cropCanvas.height = height

	cropCtx.drawImage(url, 0, 0, width, height);

	return cropCanvas.toDataURL('image/jpg');
}

const objects = [
	{
		type: 'image',
		// path: 'https://supa-dev-uploads.storage.yandexcloud.net/10/bmniboqlxion.svg',
		path: 'https://supa-dev-uploads.storage.yandexcloud.net/10/ozuhkbzmxipp.jpg',
		// path: 'https://supa-dev-uploads.storage.yandexcloud.net/10/gppuitljqxdt_screenshot.jpg',
		width: 342,
		height: 484,
		x: 108,
		y: 116,
		crop: {
			x: 109,
			y: 116,
			width: 344,
			height: 488,
		}
	},
	{
		type: 'video',
		// path: 'https://supa-dev-uploads.storage.yandexcloud.net/10/bmniboqlxion.svg',
		// path: 'https://supa-dev-uploads.storage.yandexcloud.net/10/ozuhkbzmxipp.jpg',
		width: 600,
		height: 338,
		x: -8,
		y: 109,
		_video_data: {
			cut_compressed: {
				thumbnail: 'https://supa-dev-uploads.storage.yandexcloud.net/10/gppuitljqxdt_screenshot.jpg'
			}
		}
	},
	{
		type: 'icon',
		width: 110,
		height: 96,
		x: 59,
		y: 276,
		svg: '<svg fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px"><path d="M 5 1 C 3.9 1 3 1.9 3 3 L 3 17 L 5 17 L 5 3 L 17 3 L 17 1 L 5 1 z M 9 5 C 7.9 5 7 5.9 7 7 L 7 21 C 7 22.1 7.9 23 9 23 L 20 23 C 21.1 23 22 22.1 22 21 L 22 7 C 22 5.895 21.105 5 20 5 L 9 5 z M 14.5 9.4570312 L 18 11.013672 L 18 12.869141 C 18 15.914141 15.496 17.336109 14.5 17.537109 C 13.504 17.337109 11 15.914141 11 12.869141 L 11 11.013672 L 14.5 9.4570312 z"/></svg>'
	},
	{
		id: 'dsds',
		type: 'rect',
		x: 315,
		y: 82,
		width: 200,
		height: 100,
		// style: { // rect с простой заливкой цветом
		// 	background: 'rgb(102, 102, 255)',
		// 	border_radius: 10,
		// 	border_top: 5,
		// 	border_right: 5,
		// 	border_bottom: 5,
		// 	border_left: 5,
		// 	border_color: 'rgb(102, 255, 102)',
		// 	border_all: 5,
		// 	border_style: 'dotted', // solid, dashed, dotted
		// }
		// style: { // linear или radial градиент
		// 	background: {
		// 		type: 'gradient',
		// 		angle: 90,
		// 		gradient_type: 'linear', // radial
		// 		points: [
		// 			{ color: 'rgba(33,212,253,1)', percent: 0 },
		// 			{ color: 'rgba(183,33,255,1)', percent: 1 },
		// 		]
		// 	},
		// 	border_radius: 10,
		// 	border_top: 5,
		// 	border_right: 5,
		// 	border_bottom: 5,
		// 	border_left: 5,
		// 	border_color: 'rgb(102, 255, 102)',
		// 	border_all: 5,
		// 	border_style: 'dotted', // solid, dashed, dotted
		// }
		style: { // image
			background: {
				type: 'image',
				path: 'https://supa-dev-uploads.storage.yandexcloud.net/10/kfukprdxuhmo.jpg',
				naturalWidth: 259,
				naturalHeight: 194,
				fill_type: 'fill', // fill, fit, stretch, tile
				zoom: 0.50, // нужен только для tile
			},
			border_radius: 10,
			border_top: 5,
			border_right: 5,
			border_bottom: 5,
			border_left: 5,
			border_color: 'rgb(102, 255, 102)',
			border_all: 5,
			border_style: 'dotted', // solid, dashed, dotted
		}
	},
	{
		type: 'text',
		// text: "От руки\n",
		text: "Далеко-далеко за словесными горами в стране гласных и согласных живут рыбные тексты. гласных и согласных живут рыбные тексты",
		x: 59,
		y: 10,
		width: 344,
		height: 54,
		opacity: 100,
		style: {
			font_family: 'Caveat v2',
			font_size: 18,
			font_weight: 400,
			line_height: 1.3,
			color: 'rgb(255, 0, 0)',
			text_align: 'right', // left, right, center
			stroke_color: 'rgb(0, 255, 0)',
			text_background_color: 'rgb(204, 255, 255)',
			underline: true,
			strikethrough: true,
      extra_color: '#ffd800',
		}
	},
	{ // если брать лотти или rect из редактора, то надо к svg добавлять xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" width="287px" height="208px"
		type: 'rect-svg',
    // Простая фигура с заливкой цветом
		// svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" width="287px" height="208px" class="__supa_player__slide-object-rect" style="height: 100%; max-width: 100%; max-height: 100%; min-height: 100%; min-width: 100%; filter: none; position: absolute; width: 100%;"><path d="M0,0h287a0,0 0 0 1 0,0v208a0,0 0 0 1 -0,0h-287a0,0 0 0 1 -0,-0v-208a0,0 0 0 1 0,-0z" style="fill: rgb(51, 51, 255)" class="__supa_player__svg-shape"></path><path d="" style="stroke: null; stroke-width: 0; fill-opacity: 0" class="__supa_player__svg-shape" id="yof7h"></path></svg>`,
		// фигура с заливкой изображением
    svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" width="287px" height="208px" class="__supa_player__slide-object-rect" style="height: 100%; max-width: 100%; max-height: 100%; min-height: 100%; min-width: 100%; filter: none; position: absolute; width: 100%;"><pattern id="7jefv_u4pos" patternUnits="userSpaceOnUse" patternTransform="scale(1)" x="0" y="0" width="287" height="208"><image href="https://gc-dev-uploads.supafiles.com/10/zvokpcjepusv.jpg" preserveAspectRatio="xMidYMid slice" x="0" y="0" width="287" height="208"></image></pattern><path d="M0,0h287a0,0 0 0 1 0,0v208a0,0 0 0 1 -0,0h-287a0,0 0 0 1 -0,-0v-208a0,0 0 0 1 0,-0z" style="fill: url(#7jefv_u4pos)" class="__supa_player__svg-shape"></path><path d="" style="stroke: null; stroke-width: 0; fill-opacity: 0" class="__supa_player__svg-shape" id="acdxn"></path></svg>`,
		x: 59,
		y: 150,
		width: 287,
		height: 208,
	}
]

const App = () => {
	const handleClick = async () => {
		window.scrollTo({
			top: 0
		})
		try {
				const ctx = new Context(600, 600); // сюда размеры видео
				console.log('ctx', ctx)

				for (const obj of objects) {
					// TODO: попробовать вместо такого варианта, добавлять фигуры как иконки (брать всю svg разметку из редактора)
					// Единственное может быть проблема с фоновой картинкой/видео, их нужно будет отдельно подгружать (по аналогии с добавлением изображений)
					// тогда возможно (obj.type === 'rect') будет не нужно
					if (obj.type === 'rect') {
						const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
						svg.setAttribute('width', obj.width);
						svg.setAttribute('height', obj.height);

						if (typeof obj.style.background === 'string') {
							const rect = `<rect
								x="0" y="0"
								width="${obj.width}"
								height="${obj.height}"
								${obj.style.border_radius ? `rx="${obj.style.border_radius}"` : ''} fill="${obj.style.background}"
							/>`;

							svg.insertAdjacentHTML('beforeend', rect);

							document.body.appendChild(svg)
						} else {
							if (obj.style.background.type === 'gradient') {
								const gradientType = obj.style.background.gradient_type === 'linear'
									? `<linearGradient id="${obj.id}" gradientTransform="rotate(${obj.style.background.angle})">`
									: `<radialGradient id="${obj.id}">`

								const gradient = `
									${gradientType}
										<stop offset="${obj.style.background.points[0].percent * 100}%" stop-color="${obj.style.background.points[0].color}" />
										<stop offset="${obj.style.background.points[1].percent * 100}%" stop-color="${obj.style.background.points[1].color}" />
									</linearGradient>
								`;
								const rect = `<rect x="0" y="0" width="${obj.width}" height="${obj.height}" ${obj.style.border_radius ? `rx="${obj.style.border_radius}"` : ''} fill="url('#${obj.id}')" />`;

								svg.insertAdjacentHTML('beforeend', gradient)
								svg.insertAdjacentHTML('beforeend', rect)
							} else if (obj.style.background.type === 'image') {
                // TODO: тут есть проблема, в svg всё правильно формируется, а в pdf нет
                // Как вариант, можно не страдать этой фигнёй, а просто добавлять фигуры как иконки.
                // Ну или добавлять в растровом формате
								const imageData = await loadImage(obj.style.background.path);
								console.log('imageData', imageData)

								const cropUrl = createCanvasImage(imageData, obj.style.background.naturalWidth, obj.style.background.naturalHeight);

								let preserveAspectRatio = ''

								if (obj.style.background.fill_type === 'fill') {
									preserveAspectRatio = 'xMidYMid slice'
								} else if (obj.style.background.fill_type === 'fit') {
									preserveAspectRatio = 'xMidYMid meet'
								} else if (obj.style.background.fill_type === 'stretch' || obj.style.background.fill_type === 'tile') {
									preserveAspectRatio = 'none'
								}

								const pattern = `
									<pattern id="${obj.id}" patternUnits="userSpaceOnUse" patternTransform="scale(${obj.style.background.fill_type !== 'tile' ? 1 : obj.style.background.zoom})" x="0" y="0" width="${obj.style.background.fill_type !== 'tile' ? obj.width : obj.style.background.naturalWidth}" height="${obj.style.background.fill_type !== 'tile' ? obj.height : obj.style.background.naturalHeight}">
										<image href="${cropUrl}" preserveAspectRatio="${preserveAspectRatio}" x="0" y="0" width="${obj.style.background.fill_type !== 'tile' ? obj.width : obj.style.background.naturalWidth}" height="${obj.style.background.fill_type !== 'tile' ? obj.height : obj.style.background.naturalHeight}"></image>
									</pattern>
								`;
								const rect = `<rect x="0" y="0" width="${obj.width}" height="${obj.height}" ${obj.style.border_radius ? `rx="${obj.style.border_radius}"` : ''} fill="url('#${obj.id}')" />`;

								svg.insertAdjacentHTML('beforeend', pattern)
								svg.insertAdjacentHTML('beforeend', rect)

								document.body.appendChild(svg)

								// Если нужна картинка, но рамка не работает, так как она внизу добавляется
								// const svgString = new XMLSerializer().serializeToString(svg);
								// const svgUrl = `data:image/svg+xml;base64,${window.btoa(svgString)}`;

								// const data = await loadImage(svgUrl);

								// const canvasImage = createCanvasImage(data, obj.width, obj.height);
								// console.log('canvasImage', canvasImage)
							}
						}

						if (obj.style.border_all > 0) {
							const maxRadius = Math.min(obj.width, obj.height) / 2;
							const radius = obj.style.border_radius > maxRadius ? maxRadius : obj.style.border_radius || 0;
							const isRadiusZero = radius === 0;
							const borderWidth = obj.style.border_all / 2;
							const borderRadius = isRadiusZero ? 0 : radius - borderWidth;
							const dxCoeff = 0.70710678;
							const dyCoeff = 0.29289322;
							const delta = isRadiusZero ? borderWidth : radius * dyCoeff + borderWidth * dxCoeff;
							const arcDx = borderRadius * dxCoeff;
							const arcDy = borderRadius * dyCoeff;
							const doubleRadius = radius * 2;
							const h = obj.width - doubleRadius;
							const v = obj.height - doubleRadius;
							const x1 = isRadiusZero ? 0 : delta;
							const y1 = delta;
							const x2 = isRadiusZero ?  obj.width - borderWidth : obj.width - delta;
							const y2 = isRadiusZero ? 0 : delta;
							const x3 = isRadiusZero ? obj.width : obj.width - delta;
							const y3 = isRadiusZero ? obj.height - borderWidth : obj.height - delta;
							const x4 = isRadiusZero ? borderWidth : delta;
							const y4 = isRadiusZero ? obj.height : obj.height - delta;

							const borderTop = _getBorderPath('h', x1, y1, borderRadius, h, arcDx, -arcDy, arcDx, arcDy);
							const borderRight = _getBorderPath('v', x2, y2, borderRadius, v, arcDy, arcDx, -arcDy, arcDx);
							const borderBottom = _getBorderPath('h', x3, y3, borderRadius, -h, -arcDx, arcDy, -arcDx, -arcDy);
							const borderLeft = _getBorderPath('v', x4, y4, borderRadius, -v, -arcDy, -arcDx, arcDy, -arcDx);

							let dasharray = null;
							let dashoffset = null;

              // TODO: Вставил для теста, тут нужно динамически формировать
							if (obj.style.border_style === 'dashed') {
								dasharray = '10, 5'; // obj.style.border_all * 2, obj.style.border_all
							} else if (obj.style.border_style === 'dotted') {
								dasharray = '0, 10'; // 0, obj.style.border_all * 2
								dashoffset = '2.5'; // obj.style.border_all / 2
							}

							const borders = `<path d="${obj.style.border_top && borderTop}${obj.style.border_right && borderRight}${obj.style.border_bottom && borderBottom}${obj.style.border_left && borderLeft}" stroke="${obj.style.border_color}" stroke-width="${obj.style.border_all}" ${dasharray && `stroke-dasharray="${dasharray}"`} ${dashoffset && `stroke-linecap="round" stroke-dashoffset="${dashoffset}"`} fill-opacity="0" />`

							svg.insertAdjacentHTML('beforeend', borders);
						}

						const svgString = new XMLSerializer().serializeToString(svg);
						const svgUrl = `data:image/svg+xml;base64,${window.btoa(svgString)}`;

						const data = await loadImage(svgUrl);

						ctx.drawImage(data, obj.x, obj.y, obj.width, obj.height);
					}
					else if (obj.type === 'text') {
						ctx.font = `${obj.style.font_size}px ${obj.style.font_family}`;

						let wrappedText = wrapText(ctx, obj.text, obj.x, obj.y + obj.style.font_size, obj.width, obj.style.line_height * obj.style.font_size, obj.style.text_align);

						wrappedText.forEach(async (item) => {
              // TODO: подумать как быть с extra_color

							if (obj.style.stroke_color) {
								ctx.strokeStyle = obj.style.stroke_color;
								ctx.lineWidth = 2;
								ctx.strokeText(item[0], item[1], item[2]);
							}

							if (obj.style.text_background_color) {
								ctx.fillStyle = obj.style.text_background_color;
							}

							ctx.fillStyle = obj.style.color;
							// item[0] is the text
							// item[1] is the x coordinate to fill the text at
							// item[2] is the y coordinate to fill the text at
							ctx.fillText(item[0], item[1], item[2]);
					  })

            // Как вариант можно преобразовать текст в path, тогда не нужно будет грузить шрифты
						// TEXT TO SVG PATH
					// 	TextToSVG.load('https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Regular.ttf', function(err, textToSVG) {
					// 		const svgg = textToSVG.getSVG(obj.text, {
					// 			x: 0,
					// 			y: 0,
					// 			fontSize: 18,
					// 			letterSpacing: 0,
					// 			width: 499,
					// 		});
					// 		// const svg = textToSVG.getSVG('От руки');
					// 		console.log('textToSVG', svgg);

					// 		const parser = new DOMParser();
					// 		const svgElem =  parser.parseFromString(svgg, "image/svg+xml");

					// 		document.body.appendChild(svgElem.firstElementChild);
					//   });

					} else if (obj.type === 'image' || obj.type === 'video') { // TODO: добавить фильтры
						let data = await loadImage(obj.type === 'video' ? obj._video_data.cut_compressed.thumbnail : obj.path)

						const cropCanvas = document.createElement('canvas');
						const cropCtx = cropCanvas.getContext('2d');

						cropCanvas.width = obj.width
						cropCanvas.height = obj.height

						if (obj.crop) {
							cropCtx.drawImage(data, obj.x, obj.y, obj.width, obj.height, 0, 0, obj.width, obj.height)
						} else {
							cropCtx.drawImage(data, 0, 0, obj.width, obj.height)
						}

						const cropUrl = cropCanvas.toDataURL('image/jpg') // TODO: тип нужно узнавать (а может и нет, проверить разные форматы в объекте)
						data = await loadImage(cropUrl)

						ctx.drawImage(data, obj.x, obj.y, obj.width, obj.height);
					} else if (obj.type === 'icon' || obj.type === 'rect-svg') {
					// } else if (obj.type === 'icon') {
            // TODO: в rect-svg как-то отдельно загружать картинки нужно для фигур с заливкой (по аналогии с obj.type === 'image'), формировать новый svg и добавлять как иконку

						const parser = new DOMParser();
						const svgElem =  parser.parseFromString(obj.svg, "image/svg+xml").firstElementChild

						document.body.appendChild(svgElem)

						const bbox = svgElem.getBBox()

						const maxSize = 110;

						const svgSize = calcSvgObjectSize(bbox.width, bbox.height, maxSize)


						const svgUrl = `data:image/svg+xml;base64,${window.btoa(obj.svg)}`
						console.log('svgUrl', svgUrl)

						const data = await loadImage(svgUrl)

						ctx.drawImage(data, obj.x, obj.y, svgSize.width, svgSize.height);

						document.body.removeChild(svgElem)
					}
				}

				// ctx.getSerializedSvg(); // returns the serialized SVG
				const svg = ctx.getSvg(); // returns the inline svg element
				// console.log('ctx.getSerializedSvg()', ctx.getSerializedSvg())
				console.log('svg', svg)

				svg.insertAdjacentHTML('afterbegin', `<style>
				@font-face{font-family:Caveat v2;font-weight:400;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Regular.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Regular.ttf) format("truetype")}@font-face{font-family:Caveat v2;font-weight:500;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Medium.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Medium.ttf) format("truetype")}@font-face{font-family:Caveat v2;font-weight:600;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-SemiBold.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-SemiBold.ttf) format("truetype")}@font-face{font-family:Caveat v2;font-weight:700;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Bold.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Bold.ttf) format("truetype")}
				</style>`)

				console.log('serialized', svg.outerHTML)

				document.body.appendChild(svg)

				// save PDF
				const doc = new jsPDF({
					// orientation: "landscape",
					unit: 'px',
					// format: [bbox.width, bbox.height]
					format: [600, 600],
					// filters: ["ASCIIHexEncode"]
				})


				// TODO: тут нужно перебирать все объекты, находить тексты, и формировать массив уникальных шрифтов (как-то с учётом начертания)
				// затем в цикле их загружать

				// add the font to jsPDF
				const { font } = await loadFont('https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Regular.ttf');

				doc.addFileToVFS("Caveat.ttf", font); // filename, filecontent
				doc.addFont("Caveat.ttf", "Caveat v2", "normal");
				doc.setFont("Caveat v2");

				// console.log('jsPDF.getFontList()', doc.getFontList())

				await doc
					.svg(svg, {
						x: 0,
						y: 0,
						width: 600,
						height: 600
					})

				doc.save('myPDF.pdf')


			// 	await doc.html(document.querySelector('.pdf'), {
			// 		callback: function (doc) {
			// 			doc.save('myPDF.pdf');
			// 		},
			// 		x: 0,
			// 		y: 0
			// 	});

			// });
		} catch (error) {

		}
	}

	return (
		<>
			<style>
			{`@font-face{font-family:Caveat v2;font-weight:400;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Regular.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Regular.ttf) format("truetype")}@font-face{font-family:Caveat v2;font-weight:500;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Medium.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Medium.ttf) format("truetype")}@font-face{font-family:Caveat v2;font-weight:600;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-SemiBold.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-SemiBold.ttf) format("truetype")}@font-face{font-family:Caveat v2;font-weight:700;font-style:normal;src:url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Bold.woff2) format("woff2"),url(https://gc-fonts.supafiles.com/v2/families/Caveat/Caveat-Bold.ttf) format("truetype")}
			`}
			</style>
			<span className="text" style={{font: '30px Caveat v2'}}>objects to svg</span>
			<button onClick={handleClick}>Generate svg/pdf</button>
	  </>
  )
}

export default App
