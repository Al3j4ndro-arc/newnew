import React, { useState } from 'react';

import FeedbackRow from './FeedbackRow';
import Bar from './Bar';

const FeedbackCard = ({ feedback }) => {
    const [selectedComment, setSelectedComment] = useState(null);
    const [commentOpen, setCommentOpen] = useState(false);

    const handleCommentOpen = () => {
        setCommentOpen(true);
    };

    const handleCommentClosed = () => {
        setCommentOpen(false);
    };

    const values = [{
        id: "commitment",
        name: "Commitment",
        group: "1",
    },
    {
        id: "socialfit",
        name: "Social Fit",
        group: "2",
    },
    {
        id: "challenge",
        name: "Willingness to take on a challenge",
        group: "3",
    },
    {
        id: "tact",
        name: "Tact/Professionalism",
        group: "4",
    }];



    return (
        !commentOpen ?
        (<div className="p-2 w-full">
            <h1 className="p-2 text-center text-2xl font-bold tracking-tight">Feedback</h1>
            <div className="p-2 grid grid-cols-6">
                <div className="col-span-1 font-bold text-center">Event</div>
                <div className="col-span-1 font-bold text-center">Submitted By</div>
                <div className="col-span-1 text-center">Commitment</div>
                <div className="col-span-1 text-center">Social Fit</div>
                <div className="col-span-1 text-center">Challenge</div>
                <div className="col-span-1 text-center">Professionalism</div>
            </div>

            {feedback.map((comment) => (
                <div className="w-full p-0.5" onClick={() => {setSelectedComment(comment); handleCommentOpen()}}>
                    <FeedbackRow comment={comment}/>
                </div>
            ))}
        
        </div>):
        <div className="p-2 w-full">
            {selectedComment && (
                <div>
                    <button className="p-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-100" onClick={() => handleCommentClosed()}> Exit </button>
                    <div className="p-2 w-full grid grid-cols-2 text-center text-2xl tracking-tight">
                        <h1 className="col-start-1 p-2"> <strong>Event:</strong> {selectedComment.event}</h1>
                        <h1 className="col-end-2 p-2"> <strong>Submitted by:</strong> {selectedComment.submittedBy}</h1>
                    </div>
                    {values.map((value) => (
                        <div className="p-2">
                            <div className="grid grid-cols-2 p-2">
                                <h1 className = "text-l tracking-wide">{value.name}:</h1>
                                <Bar color={selectedComment[value.id]}/>
                            </div>
                            <div className="p-2 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600">
                                <p>{selectedComment.comments[value.id]}</p>
                            </div>
                        </div>
                    ))}
                    <div className = "p-2">
                        <h1 className = "text-l tracking-wide p-2">General Comments:</h1>
                        <div className="p-2 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600">
                            <p>{selectedComment.comment}</p>
                        </div>
                    </div>


                </div>
        )}
        </div>
    );
};

export default FeedbackCard;
