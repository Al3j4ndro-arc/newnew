import React, { useState , useEffect } from 'react';

const Bar = (color) => {
    const [isLoading, setIsLoading] = useState(true);
    const [colors, setColor] = useState({
        green:"",
        yellow:"",
        red:"",
        white:"",
    })

    const handleColor = (id) => {
        let currentColors = { ...colors };
        currentColors[id.color] = "1";
        setColor(currentColors);
    };

    useEffect(() => {
        handleColor(color);
        setIsLoading(false);
    }, []);


    return (
        isLoading? <div></div> :
        <div className="w-full col-start-2 grid grid-cols-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className={"col-span-1 feedbackgreen"+colors.green}></div>
            <div className={"col-span-1 feedbackyellow"+colors.yellow}></div>
            <div className={"col-span-1 feedbackred"+colors.red}></div>
            <div className={"col-span-1 feedbackwhite"+colors.white}></div>
        </div>
    );
};

export default Bar;
