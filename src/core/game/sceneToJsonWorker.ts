self.onmessage = (event) => {
    const { sceneData } = event.data;
    
    try{
        const json = JSON.stringify(sceneData);
        self.postMessage({ json });
    } catch (error) {
        self.postMessage({ error: (error as Error).message }, []);
    }
}
