import React from 'react';
import {Card, CardHeader, CardBody, CardFooter, Avatar} from "@nextui-org/react";

export const UserCard = ({message}) => {
  return (
    <Card className="max-w-[340px]">
        <CardHeader className="justify-between">
            <Avatar isBordered radius="full" size="md" src="https://nextui.org/avatars/avatar-1.png" />
        </CardHeader>
        <CardBody>
            {message}
        </CardBody>
    </Card>
  )
};
