# Strips LoRa Translator Chirpstack

This decoder is basically the same as the original payload decoder, with the exceptions of a few edits to fit the Chirpstack format.

Please note that this version should only be used with Chirpstack, for other Network Servers, we recommend https://gitlab.com/sensative/strips-lora-translator-open-source


<br>

## Install

1. Log in to your Chirptack console and go to `Device-profiles`
2. Select the device profile that you want to use with Sensative Strips
3. Go to the `Codec` tab
4. Choose `Custom JavaScript codec functions` under `Payload codec`
5. Paste the code from `sensative-strips-decoder-chirpstack.js` into the first box
6. Press `UPDATE DEVICE-PROFILE`
