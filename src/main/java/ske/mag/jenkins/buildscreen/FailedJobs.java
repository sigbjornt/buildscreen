package ske.mag.jenkins.buildscreen;

import java.util.Collection;
import java.util.List;
import hudson.model.AbstractBuild;
import hudson.model.TopLevelItem;
import jenkins.model.Jenkins;
import ske.mag.jenkins.buildscreen.comparators.ClaimComparator;
import ske.mag.jenkins.buildscreen.comparators.LastSuccesfullBuildComparator;
import static com.google.common.collect.Ordering.from;
import static hudson.model.Result.*;
import static ske.mag.jenkins.buildscreen.collections.CollectionFilter.filter;

public class FailedJobs {

	public static List<FailedJob> brokenBuilds(Collection<TopLevelItem> allProjects) {
		return sortByClaimAndLastSuccessfulBuild(convertList(filter(allProjects).onlyEnabledJobs().byResult(FAILURE)));
	}

	public static List<FailedJob> failedBuilds(Collection<TopLevelItem> allProjects) {
		return sortByClaimAndLastSuccessfulBuild(convertList(filter(allProjects).onlyEnabledJobs().byResult(UNSTABLE)));
	}

	private static Collection<FailedJob> convertList(Collection<AbstractBuild> buildsToConvert) {
		return transform(buildsToConvert).toFailedJobs();
	}

	private static List<FailedJob> sortByClaimAndLastSuccessfulBuild(Collection<FailedJob> jobsToSort) {
		return from(new ClaimComparator()).compound(new LastSuccesfullBuildComparator()).sortedCopy(jobsToSort);
	}

	private static AbstractBuildTransformer transform(Collection<AbstractBuild> buildsToConvert) {
		return new AbstractBuildTransformer(Jenkins.getInstance(), buildsToConvert);
	}
}
