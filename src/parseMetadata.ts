function parseMetadataString(metadataString: string): Record<string, { encoded: string; decoded: string }> {
    const kvPairList: string[] = metadataString.split(',');

    return kvPairList.reduce<Record<string, { encoded: string; decoded: string }>>((metadata, kvPair) => {
        const [key, base64Value] = kvPair.split(' ');

        if (!base64Value) {
            console.warn(`Missing value for key: ${key}`);
            return metadata;
        }

        try {
            metadata[key] = {
                encoded: base64Value,
                decoded: Buffer.from(base64Value, 'base64').toString('ascii'),
            };
        } catch (e: any) {
            console.warn(`Could not decode value for key: ${key}. Error: ${e.message}`);
        }

        return metadata;
    }, {});
}


export {
    parseMetadataString,
}