import { Fragment, FunctionComponent, useEffect, useState } from "react";
import { MakePost } from "./MakePost";
import { Post } from "./Post";
import { useLdo, useResource, useSolidAuth } from "@ldo/solid-react";
import { ContainerUri, Container } from "@ldo/solid";

export const Blog: FunctionComponent = () => {
  const { session } = useSolidAuth();

  const { getResource } = useLdo();
  const [mainContainerUri, setMainContainerUri] = useState<
    ContainerUri | undefined
  >();

  useEffect(() => {
    if (session.webId) {
      // Get the WebId resource
      const webIdResource = getResource(session.webId);
      // Get the root container associated with that WebId
      webIdResource.getRootContainer().then((rootContainerResult) => {
        // Check if there is an error
        if (rootContainerResult.isError) return;
        // Get a child of the root resource called "my-solid-app/"
        const mainContainer = rootContainerResult.child("my-solid-app/");
        setMainContainerUri(mainContainer.uri);
        // Create the main container if it doesn't exist yet
        mainContainer.createIfAbsent();
      });
    }
  }, [getResource, session.webId]);


  const mainContainer = useResource(mainContainerUri);

  return (
    <main>
      <MakePost mainContainer={mainContainer} />
      <hr />
      {mainContainer
        // Get all the children of the main container
        ?.children()
        // Filter out children that aren't containers themselves
        .filter((child): child is Container => child.type === "container")
        // Render a "Post" for each child
        .map((child) => (
          <Fragment key={child.uri}> 
            <Post key={child.uri} postUri={child.uri} />
            <hr />
          </Fragment>
        ))}
    </main>
  );
};
