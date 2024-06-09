import React from 'react';
import { Card, CardHeader, CardBody, Avatar } from "@nextui-org/react";

export const UserCard = ({ message, profilePicture }) => {
  return (
    <Card className={`max-w-max dark:bg-gray-800 dark:text-gray-200 bg-gray-100 text-gray-800`}>
      <CardHeader className="justify-between">
        <Avatar isBordered radius="full" size="md" src={profilePicture} />
      </CardHeader>
      <CardBody>
        {message}
      </CardBody>
    </Card>
  )
};
