Feature('Watch socket messages');

Before((login) => {
    login('admin');
});

const jsonTemplate = {
    label: 'String Template',
    attrs: [
        {
            label: 'text',
            type: 'dynamic',
            value_type: 'string',
        },
    ],
};


Scenario('@adv: Watching a simple message', async (I, Device) => {
    const template = await I.createTemplate(jsonTemplate);
    const templateId = template.template.id;
    const device = await I.createDevice({
        templates: [
            templateId,
        ],
        label: 'String device',
    });
    const deviceId = device.devices[0].id;
    const msg = 'my string';

    await I.sendMQTTMessage(deviceId, `{"text": "${msg}"}`);

    I.amOnPage(`#/device/id/${deviceId}/detail`);
    I.wait(2);
    Device.selectAttr('text');
    I.wait(3);
    Device.shouldSeeMessage(msg);
});