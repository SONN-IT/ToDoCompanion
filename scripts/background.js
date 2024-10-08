browser.messageDisplayAction.onClicked.addListener(async () => {
    await main();
});

async function main() {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    // console.log("tabs: ", tabs);
    const tabId = tabs[0].id;
    const message = await browser.messageDisplay.getDisplayedMessage(tabId);
    // console.log("message: ", message);
    if (!message) {return 0}

    if (message.folder.path === "/Trash") {
        // console.log("trash mail: exit")
        browser.notifications.create({
            "type": "basic",
            "title": browser.i18n.getMessage("ErrorMessageTitle"),
            "message": browser.i18n.getMessage("ErrorMessageMailFromTrash")
        });
    } else {
        browser.messages.onCopied.addListener(async function copiedMessageListener(originalMessages, copiedMessages) {
            // console.log("copiedMessageListener");
            const originalMessage = originalMessages.messages[0];
            const copiedMessage = copiedMessages.messages[0];

            if (originalMessage.id === message.id && copiedMessage) {
                const headerMessageId = copiedMessage.headerMessageId
                // console.log("copiedMessage imapUid", headerMessageId);
                // console.log("copiedMessage: ", copiedMessage);
                try {
                    managedStorage = await browser.storage.managed.get('URL');
                  } catch (e) {
                    console.error(e);
                    return;
                }

                console.log("ToDoCompanion - managedStorage: ", managedStorage);
            
                var baseUrl = managedStorage.URL;

                if (baseUrl == null) {
                    browser.notifications.create({
                        "type": "basic",
                        "title": browser.i18n.getMessage("ErrorMessageTitle"),
                        "message": browser.i18n.getMessage("ErrorMessageMissingConfig")
                    });
                    return
                }

                if(headerMessageId) {
                    const query = "msgID=" + encodeURIComponent(headerMessageId);
                    await new Promise(r => setTimeout(r, 500));
                    browser.windows.openDefaultBrowser(baseUrl + "?" + query);
                } else {
                    browser.notifications.create({
                        "type": "basic",
                        "title": browser.i18n.getMessage("ErrorMessageTitle"),
                        "message": browser.i18n.getMessage("ErrorMessageGeneral")
                    });
                }
            }
            browser.messages.onCopied.removeListener(copiedMessageListener);
        });

        try {
            await browser.messages.copy([message.id], {
                accountId: message.folder.accountId,
                path: '/Trash'
            });
        } catch (e) {
            // console.log("Failed to copy message: ", e);
            browser.notifications.create({
                "type": "basic",
                "title": browser.i18n.getMessage("ErrorMessageTitle"),
                "message": browser.i18n.getMessage("ErrorMessageFailedCopy")
            });
        }
    }
}