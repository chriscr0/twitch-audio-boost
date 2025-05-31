// ==UserScript==
// @name         Twitch Audio Boost
// @namespace    https://github.com/chriscr0/
// @version      2025-05-30
// @description  Boost audio volume on twitch players
// @author       chriscr0
// @match        https://www.twitch.tv/*
// @icon         https://assets.twitch.tv/assets/favicon-16-52e571ffea063af7a7f4.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Constants
    const DEFAULT_AUDIO_GAIN_VALUE = 1.75;
    const ATTRIBUTE_GAIN_MARKER = "data-tab-gain"
    const ATTRIBUTE_VIDEO_ID = "data-tab-video-id";

    // Globals
    const observer = new MutationObserver(processBodyChange);
    const audioCtx = new AudioContext();
    const idGenerator = videoIdGenerator();
    const gainNodeMap = {};

    // Attatch observer to the document body
    observer.observe(document.querySelector("body"), {
        subtree: true,
        childList: true,
        attributes: true,
    });

    /**
     * Generator that produces a sequence of integers
     */
    function* videoIdGenerator() {
        for (let i=0; ; i++) {
            yield i;
        }
    }

    /**
     * Callback to handle observed document mutations
     * @param {List<MutationRecord>} mutations List of mutations
     */
    function processBodyChange(mutations) {
        mutations.forEach((mutation) => {
           if (mutation.type === "childList") {
               mutation.addedNodes.forEach(processAddedNode);
           } else if (mutation.type === "attributes" && mutation.attributeName === ATTRIBUTE_GAIN_MARKER) {
               processGainAttributeMutation(mutation.target);
           }
        });
    }

    /**
     * Process the added nodes
     * @param {Node} node The Node that was added
     */
    function processAddedNode(node) {
        if (node.nodeName === "VIDEO" && node.getAttribute(ATTRIBUTE_GAIN_MARKER) == null) {
            setupAudioGain(node);
        }
    }

    /**
     * Processes updates to the gain attribute on the video element
     * @param {Node} videoNode A video element node
     */
    function processGainAttributeMutation(videoNode) {
        const newGain = parseFloat(videoNode.getAttribute(ATTRIBUTE_GAIN_MARKER));
        const vid = videoNode.getAttribute(ATTRIBUTE_VIDEO_ID);

        if (newGain == null || vid == null) {
            console.error(`Couldn't update gain for Video ID: ${vid}, Gain: ${newGain}`);
            return;
        }

        gainNodeMap[vid].gain.value = newGain;
        console.log(`Updated gain for Video ID: ${vid}, Gain: ${newGain}`);
    }

    /**
     * Setup the audio gain for the video player element
     * @param {*} videoNode A video element node
     */
    function setupAudioGain(videoNode) {
        const source = audioCtx.createMediaElementSource(videoNode);

        // Create a gain node
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = DEFAULT_AUDIO_GAIN_VALUE;

        // Connect the AudioBufferSourceNode to the gainNode
        // and the gainNode to the destination
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // save the gain node for later
        const videoNodeId = idGenerator.next().value
        gainNodeMap[videoNodeId] = gainNode;

        // note that we have applied gain to this player
        videoNode.setAttribute(ATTRIBUTE_GAIN_MARKER, gainNode.gain.value);
        videoNode.setAttribute(ATTRIBUTE_VIDEO_ID, videoNodeId);
    }

})();