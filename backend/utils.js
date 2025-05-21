function getMediaType(url) {
    if (!url) return null;
    const extension = url.split('.').pop().toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (['mp4', 'webm', 'mov'].includes(extension)) return 'video';

    return null;
}

// userId → sessionData
const activeSessions = new Map();

function setSession(userId, sessionData) {
    activeSessions.set(userId, sessionData);
}

function getSession(userId) {
    return activeSessions.get(userId) || null;
}

function removeSession(userId) {
    activeSessions.delete(userId);
}

module.exports = {
    getMediaType,
    setSession,
    getSession,
    removeSession
};
