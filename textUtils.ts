export {defangIp, defangDomain, lowerSha256}

function defangIp(text: string) {
    return text.replaceAll(/(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3}))/g, "$1[.]$2");
}

function defangDomain(text: string) {
    return text.replaceAll(/http(s?):\/\/([^\/]*)\.([\/\.]+\/?.*)/g, "hxxp$1[://]$2[.]$3");
}

function lowerSha256(text: string) {
    return text.replace(/(\w{64})/g, function(match) {
        return match.toLowerCase();
    });
}