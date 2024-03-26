import React from 'react';
import { Card, CardHeader, CardBody, Avatar } from "@nextui-org/react";

export const UserCard = ({ message }) => {
  return (
    <Card className="max-w-max bg-blue-100">
      <CardHeader className="justify-between">
        <Avatar isBordered radius="full" size="md" src="https://nextui.org/avatars/avatar-1.png" />
      </CardHeader>
      <CardBody color="light">
        {message}
      </CardBody>
    </Card>
  )
};
