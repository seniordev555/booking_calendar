/* 
 * winston helper
 */
function init(logger) {
    logger.add(logger.transports.File, {
        name: "info-file",
        level: "info",
        json: false,
        filename: "info.log"
    });

    logger.add(logger.transports.File, {
        name: "error-file",
        level: "error",
        json: false,
        filename: "error.log"
    });    
}


module.exports = {
    init: init
};