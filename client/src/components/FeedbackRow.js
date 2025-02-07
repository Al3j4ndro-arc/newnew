import React from 'react';

const FeedbackRow = ({ comment }) => {


    return (
        <div className="w-full p-2 hover:shadowgrey border border-gray-200 rounded-lg flex relative">
            <div className="w-full grid grid-cols-6">
                <div className="col-span-1 text-center">{comment.event}</div>
                <div className="col-span-1 text-center">{comment.submittedBy}</div>
                <div className="col-span-4 grid grid-cols-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className={"col-span-1 feedback"+comment.commitment}></div>
                    <div className={"col-span-1 feedback"+comment.socialfit}></div>
                    <div className={"col-span-1 feedback"+comment.challenge}></div>
                    <div className={"col-span-1 feedback"+comment.tact}></div>
                </div>
            </div>
        </div>

    );
};

export default FeedbackRow;
