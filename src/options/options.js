import './options.css';
import $ from 'jquery';
import Jscolor from '@eastdesire/jscolor';

Jscolor.presets.default = {
    position: 'right',
    palette: [
        '#000000', '#7d7d7d', '#870014', '#ec1c23', '#ff7e26',
        '#fef100', '#22b14b', '#00a1e7', '#3f47cc', '#a349a4',
        '#ffffff', '#c3c3c3', '#b87957', '#feaec9', '#ffc80d',
        '#eee3af', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
    ]
};

$(function () {
    initColorPicker();
    function initColorPicker() {
        chrome.storage.sync.get('Styles', ({ Styles }) => {
            const { lineColor, textColor } = Styles;
            const $lineInput = $('.color-picker[data-target="line"]');
            const linePicker = new Jscolor($lineInput[0]);
            linePicker.fromString(lineColor);
            const $textInput = $('.color-picker[data-target="text"]');
            const textPicker = new Jscolor($textInput[0]);
            textPicker.fromString(textColor);
        });

        $('.color-picker').on('change', (e) => {
            const target = $(e.target).attr('data-target');
            const color = $(e.target).val();
            chrome.runtime.sendMessage({ changeStyles: { target, color } });
        });
    }
});