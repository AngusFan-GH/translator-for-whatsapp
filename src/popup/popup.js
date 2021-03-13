$(function () {
    init();
    bindEvent();

    function init() {
        chrome.storage.sync.get(['isOpenedPanel', 'source', 'rule'], ({ isOpenedPanel, source, rule }) => {
            $('.switch').text(isOpenedPanel ? '关闭' : '开启');
            $('.source').val(source);
            $('.rule').val(rule);
        });
    }

    function bindEvent() {
        const switchBtn = $('.switch');
        switchBtn.click(() => {
            chrome.storage.sync.get(['isOpenedPanel'], ({ isOpenedPanel }) => {
                const newStatus = !isOpenedPanel;
                chrome.storage.sync.set({ isOpenedPanel: newStatus });
                switchBtn.text(newStatus ? '关闭' : '开启');
            });
        });
        $('.source').change((e) => {
            chrome.storage.sync.set({ source: e.target.value });
        });
        $('.rule').change((e) => {
            chrome.storage.sync.set({ rule: e.target.value });
        });
    }
});