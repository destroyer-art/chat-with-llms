import React from 'react';
import {Card, CardBody, CardFooter} from "@nextui-org/react";


export const AiCard = ({message}) => {
  return (
    <Card className="max-w-[340px]">
        <CardBody>
            {message}
        </CardBody>
    </Card>
  )
}
